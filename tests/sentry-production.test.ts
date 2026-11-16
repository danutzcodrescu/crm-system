import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

import * as Sentry from '@sentry/react-router';
import express from 'express';
import { createSentrySDK } from 'sentry';

import { createAppLogger, createRequestLogger } from '../app/utils/server/logger.server';
import pkg from '../package.json';
import { prepareSentryBuild } from '../tooling/sentry-build.mjs';

async function fixture(t: test.TestContext) {
  const directory = await mkdtemp(join(tmpdir(), 'crm-sentry-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  for (const path of ['client/assets', 'server', 'cmd']) await mkdir(join(directory, path), { recursive: true });
  // A real JS/map pair for each compiler output: offsets must survive injection.
  for (const path of ['client/assets/browser.js', 'server/index.js', 'cmd/server.js']) {
    await writeFile(
      join(directory, path),
      'throw new Error("synthetic-map-probe");\n//# sourceMappingURL=' + path.split('/').at(-1) + '.map\n',
    );
    await writeFile(
      join(directory, path + '.map'),
      JSON.stringify({
        version: 3,
        file: path.split('/').at(-1),
        sources: ['original.ts'],
        sourcesContent: ['throw new Error("synthetic-map-probe");'],
        names: [],
        mappings: 'AAAA',
      }),
    );
  }
  return directory;
}

test('final processing injects debug IDs into both compiler outputs, removes only client maps and preserves Node stacks', async (t) => {
  const directory = await fixture(t);
  await prepareSentryBuild({ directory, env: { SENTRY_UPLOAD: 'false', SENTRY_RELEASE: 'crm-system@test' } });
  for (const path of ['client/assets/browser.js', 'server/index.js', 'cmd/server.js']) {
    const js = await readFile(join(directory, path), 'utf8');
    assert.match(js, /debugId/);
  }
  await assert.rejects(readFile(join(directory, 'client/assets/browser.js.map')), { code: 'ENOENT' });
  const map = JSON.parse(await readFile(join(directory, 'cmd/server.js.map'), 'utf8'));
  assert.ok(map.debug_id || map.debugId);
  assert.match(map.sourcesContent[0], /synthetic-map-probe/);
  assert.deepEqual(JSON.parse(await readFile(join(directory, 'sentry-release.json'), 'utf8')), {
    release: 'crm-system@test',
  });
  assert.throws(
    () => execFileSync(process.execPath, ['--enable-source-maps', join(directory, 'cmd/server.js')], { stdio: 'pipe' }),
    (error: unknown) => error instanceof Error && 'stderr' in error && String(error.stderr).includes('original.ts:1:1'),
  );
});

test('upload happens after injection, includes the whole dist directory, and uses the same release', async (t) => {
  const directory = await fixture(t);
  const client = createSentrySDK();
  const calls: string[] = [];
  t.mock.method(client.sourcemap, 'inject', async ({ directory: root }: { directory?: string }) => {
    assert.equal(root, directory);
    calls.push('inject');
  });
  t.mock.method(client.release, 'create', async ({ orgVersion }: { orgVersion: string }) => {
    assert.equal(orgVersion, 'crm-system@test');
    calls.push('release');
  });
  t.mock.method(client.sourcemap, 'upload', async (options: unknown) => {
    assert.deepEqual(options, { directory, release: 'crm-system@test', noRewrite: true });
    await readFile(join(directory, 'client/assets/browser.js.map'));
    await readFile(join(directory, 'cmd/server.js.map'));
    calls.push('upload');
  });
  await prepareSentryBuild({
    directory,
    client,
    env: {
      SENTRY_UPLOAD: 'true',
      SENTRY_AUTH_TOKEN: 'synthetic-token',
      SENTRY_ORG: 'test',
      SENTRY_PROJECT: 'test',
      SENTRY_RELEASE: 'crm-system@test',
      VITE_SENTRY_DSN: 'https://public@example.invalid/1',
    },
  });
  assert.deepEqual(calls, ['inject', 'release', 'upload']);
});

test('deployment upload fails closed on missing credentials or upload failure', async (t) => {
  const directory = await fixture(t);
  await assert.rejects(
    prepareSentryBuild({ directory, env: { SENTRY_UPLOAD: 'true' } }),
    /SENTRY_AUTH_TOKEN is required/,
  );
  await assert.rejects(prepareSentryBuild({ directory, env: { SENTRY_UPLOAD: 'typo' } }), /SENTRY_UPLOAD must be/);
  const client = createSentrySDK();
  t.mock.method(client.sourcemap, 'inject', async () => {});
  t.mock.method(client.release, 'create', async () => {});
  t.mock.method(client.sourcemap, 'upload', async () => {
    throw new Error('synthetic upload failure');
  });
  await assert.rejects(
    prepareSentryBuild({
      directory,
      client,
      env: {
        SENTRY_UPLOAD: 'true',
        SENTRY_AUTH_TOKEN: 'synthetic-token',
        SENTRY_ORG: 'test',
        SENTRY_PROJECT: 'test',
        SENTRY_RELEASE: 'crm-system@test',
        VITE_SENTRY_DSN: 'https://public@example.invalid/1',
      },
    }),
    /synthetic upload failure/,
  );
  await readFile(join(directory, 'client/assets/browser.js.map'));
  await assert.rejects(readFile(join(directory, 'sentry-release.json')), { code: 'ENOENT' });
});

test('production Pino emits JSON/stacks and forwards only redacted warn/error logs to the real SDK', async () => {
  const logs: Sentry.Log[] = [];
  const envelopes: unknown[] = [];
  Sentry.init({
    dsn: 'https://public@example.invalid/1',
    defaultIntegrations: false,
    beforeSendLog(log) {
      logs.push(log);
      return log;
    },
    transport: () => ({
      send(envelope: unknown) {
        envelopes.push(envelope);
        return Promise.resolve({ statusCode: 200 });
      },
      flush: async () => true,
    }),
  });
  try {
    const lines: string[] = [];
    const logger = createAppLogger({
      production: true,
      destination: {
        write(line) {
          lines.push(line);
        },
      },
    });
    logger.info('synthetic info');
    logger.warn({ password: 'secret-password', nested: { token: 'secret-token' } }, 'synthetic warning');
    logger.error(
      { err: new Error('synthetic failure'), req: { headers: { authorization: 'secret-header' } } },
      'synthetic error',
    );
    await Sentry.flush(2_000);
    assert.equal(lines.length, 3);
    assert.match(JSON.parse(lines[2]).err.stack, /sentry-production.test.ts/);
    assert.deepEqual(
      logs.map((log) => log.level),
      ['warn', 'error'],
    );
    const sent = JSON.stringify(envelopes);
    for (const secret of ['secret-password', 'secret-token', 'secret-header']) {
      assert.ok(!sent.includes(secret));
      assert.ok(!lines.join('').includes(secret));
    }
    assert.match(sent, /synthetic warning/);
    assert.match(sent, /synthetic failure/);
    assert.match(sent, /\[redacted\]/i);
  } finally {
    await Sentry.close(2_000);
  }
});

test('server exception envelopes keep generated frames linked to the injected debug IDs', async (t) => {
  const directory = await fixture(t);
  await createSentrySDK().sourcemap.inject({ directory });
  const map = JSON.parse(await readFile(join(directory, 'cmd/server.js.map'), 'utf8'));
  const code = `
    import * as Sentry from ${JSON.stringify(import.meta.resolve('@sentry/react-router'))};
    Sentry.init({
      dsn: 'https://public@example.invalid/1', defaultIntegrations: false,
      beforeSend(event) { console.log(JSON.stringify(event)); return null; }
    });
    try { await import(${JSON.stringify(pathToFileURL(join(directory, 'cmd/server.js')).href)}); }
    catch (error) { Sentry.captureException(error); }
    await Sentry.close(1000);
  `;
  const event = JSON.parse(
    execFileSync(process.execPath, ['--input-type=module', '-e', code], {
      encoding: 'utf8',
      env: { ...process.env, NODE_OPTIONS: '' },
    }),
  );
  const image = event.debug_meta.images.find(
    (image: { debug_id: string }) => image.debug_id === (map.debug_id || map.debugId),
  );
  assert.ok(image, 'exception must carry the debug ID of its uploaded map');
  assert.match(image.code_file, /cmd\/server.js$/);
});

test('HTTP JSON logs omit request secrets, response cookies, bodies and URL query strings', async (t) => {
  const lines: string[] = [];
  const logger = createAppLogger({
    production: true,
    destination: {
      write(line) {
        lines.push(line);
      },
    },
  });
  const app = express();
  app.use(createRequestLogger(logger));
  app.post('/check', (_req, res) => {
    res.cookie('crm_session', 'secret-response-cookie').json({ password: 'secret-response-body' });
  });
  const server = app.listen(0, '127.0.0.1');
  t.after(() => new Promise<void>((resolve) => server.close(() => resolve())));
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  const response = await fetch(`http://127.0.0.1:${address.port}/check?token=secret-query`, {
    method: 'POST',
    headers: { authorization: 'secret-auth', cookie: 'crm_session=secret-request-cookie' },
    body: 'secret-request-body',
  });
  await response.text();
  assert.equal(lines.length, 1);
  assert.deepEqual(JSON.parse(lines[0]).res, { statusCode: 200 });
  assert.equal(JSON.parse(lines[0]).req.pathname, '/check');
  assert.ok(!lines[0].includes('secret-'));
});

test('Docker/start pipeline keeps upload credentials out of image metadata and uploads after both builds', async () => {
  const dockerfile = await readFile('Dockerfile', 'utf8');
  assert.match(dockerfile, /--mount=type=secret,id=SENTRY_AUTH_TOKEN/);
  assert.doesNotMatch(dockerfile, /^(?:ARG|ENV) SENTRY_AUTH_TOKEN/m);
  assert.doesNotMatch(dockerfile.split('FROM base\n').at(-1)!, /ADD \. \./);
  assert.doesNotMatch(dockerfile, /--enable-source-maps/);
  assert.match(pkg.scripts.build, /build:router.*build-express.*build:sentry/);
  assert.doesNotMatch(pkg.scripts.start, /--enable-source-maps/);
});

test('build-image passes the token only as an env-backed secret and never transfers a failed image', async (t) => {
  const directory = await fixture(t);
  const bin = join(directory, 'bin');
  const commandLog = join(directory, 'commands.jsonl');
  await mkdir(bin);
  // No Docker, git or SSH command can reach a real daemon/repository/host.
  for (const name of ['docker', 'git', 'ssh']) {
    const file = join(bin, name);
    await writeFile(
      file,
      `#!${process.execPath}
      const fs = require('node:fs');
      fs.appendFileSync(process.env.BUILD_COMMAND_LOG, JSON.stringify({ name: ${JSON.stringify(name)}, args: process.argv.slice(2) }) + '\\n');
      if (${JSON.stringify(name)} === 'git') console.log('synthetic-commit');
      if (${JSON.stringify(name)} === 'docker' && process.argv[2] === 'build' && process.env.FAIL_SYNTHETIC_BUILD === '1') process.exit(42);
      if (${JSON.stringify(name)} === 'ssh') process.stdin.resume();
    `,
    );
    await chmod(file, 0o755);
  }
  const env = {
    ...process.env,
    PATH: `${bin}:${process.env.PATH}`,
    NODE_OPTIONS: '',
    BUILD_COMMAND_LOG: commandLog,
    SENTRY_AUTH_TOKEN: 'synthetic-upload-secret',
    SENTRY_DSN: 'https://public@example.invalid/1',
    SENTRY_ORG: 'test',
    SENTRY_PROJECT: 'test',
    SENTRY_RELEASE: '',
    REMOTE_USER: 'synthetic-user',
    REMOTE: 'example.invalid',
  };
  const output = execFileSync(process.execPath, ['--import', 'tsx', 'scripts/build.ts'], { env, encoding: 'utf8' });
  const calls = (await readFile(commandLog, 'utf8'))
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line));
  const build = calls.find((call) => call.name === 'docker' && call.args[0] === 'build');
  assert.ok(build.args.includes('id=SENTRY_AUTH_TOKEN,env=SENTRY_AUTH_TOKEN'));
  assert.ok(build.args.includes(`SENTRY_RELEASE=crm-system@${pkg.version}+synthetic-commit`));
  assert.ok(calls.some((call) => call.name === 'ssh'));
  assert.ok(!JSON.stringify(calls).includes(env.SENTRY_AUTH_TOKEN));
  assert.ok(!output.includes(env.SENTRY_AUTH_TOKEN));
  await writeFile(commandLog, '');
  assert.throws(
    () =>
      execFileSync(process.execPath, ['--import', 'tsx', 'scripts/build.ts'], {
        env: { ...env, FAIL_SYNTHETIC_BUILD: '1' },
        stdio: 'pipe',
      }),
    (error: unknown) => error instanceof Error && 'status' in error && error.status === 1,
  );
  const failedCalls = await readFile(commandLog, 'utf8');
  assert.ok(!failedCalls.includes('"ssh"'));
  assert.ok(!failedCalls.includes('"save"'));
});
