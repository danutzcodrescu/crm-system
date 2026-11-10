import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';

import { loadConfigFromFile, optimizeDeps, resolveConfig } from 'vite';

test('development optimizer keeps the Node-only Infisical SDK out of browser prebundles', async () => {
  const cacheDir = await mkdtemp(join(tmpdir(), 'crm-vite-optimizer-'));
  const previousNodeEnv = process.env.NODE_ENV;
  const previousSmoke = process.env.CRM_SMOKE_TEST;
  process.env.NODE_ENV = 'development';
  delete process.env.CRM_SMOKE_TEST;

  try {
    const loaded = await loadConfigFromFile({ command: 'serve', mode: 'development' }, resolve('vite.config.ts'));
    assert.ok(loaded);

    // Use the real development optimizer settings without booting the app,
    // reading .env files, mocking Infisical, or contacting any secret service.
    // Scan the real server module to reproduce dependency discovery. Before the
    // exclusion, this fails on AWS's missing browser fromNodeProviderChain export.
    const config = await resolveConfig(
      {
        configFile: false,
        envFile: false,
        cacheDir,
        logLevel: 'silent',
        optimizeDeps: {
          ...loaded.config.optimizeDeps,
          entries: [resolve('app/utils/server/infisical.server.ts')],
        },
      },
      'serve',
    );
    const metadata = await optimizeDeps(config, true);
    assert.equal(metadata.optimized['@infisical/sdk'], undefined);

    const { InfisicalSDK } = await import('@infisical/sdk');
    assert.equal(typeof InfisicalSDK, 'function', 'the SDK must still load normally on the server');
  } finally {
    if (previousNodeEnv === undefined) Reflect.deleteProperty(process.env, 'NODE_ENV');
    else process.env.NODE_ENV = previousNodeEnv;
    if (previousSmoke === undefined) delete process.env.CRM_SMOKE_TEST;
    else process.env.CRM_SMOKE_TEST = previousSmoke;
    await rm(cacheDir, { recursive: true, force: true });
  }
});
