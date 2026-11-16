import { readdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { createSentrySDK } from 'sentry';

import pkg from '../package.json' with { type: 'json' };

// Runs AFTER Vite and tsc, covering application bundles and the custom server.
// Upload failures must fail deployment, rather than produce an unmapped image.
export async function prepareSentryBuild({
  directory = resolve('dist'),
  env = process.env,
  client = createSentrySDK({ token: env.SENTRY_AUTH_TOKEN, org: env.SENTRY_ORG, project: env.SENTRY_PROJECT }),
} = {}) {
  const upload = env.SENTRY_UPLOAD === 'true';
  if (env.SENTRY_UPLOAD && !['true', 'false'].includes(env.SENTRY_UPLOAD)) {
    throw new Error('SENTRY_UPLOAD must be true or false');
  }
  if (upload) {
    for (const key of ['SENTRY_AUTH_TOKEN', 'SENTRY_ORG', 'SENTRY_PROJECT', 'SENTRY_RELEASE', 'VITE_SENTRY_DSN']) {
      if (!env[key]?.trim()) throw new Error(`${key} is required when SENTRY_UPLOAD=true`);
    }
  }
  const release = env.SENTRY_RELEASE || `crm-system@${pkg.version}`;
  await client.sourcemap.inject({ directory });
  if (upload) {
    await client.release.create({ orgVersion: release, project: env.SENTRY_PROJECT });
    await client.sourcemap.upload({ directory, release, noRewrite: true });
  }
  await writeFile(resolve(directory, 'sentry-release.json'), JSON.stringify({ release }) + '\n');
  // Hidden maps still expose source if served directly. Never ship client maps,
  // even in credential-free CI builds; keep server maps private for Node stacks.
  for (const file of await readdir(resolve(directory, 'client'), { recursive: true })) {
    if (file.endsWith('.map')) await rm(resolve(directory, 'client', file));
  }
  console.log(`[sentry] ${upload ? 'Uploaded' : 'Upload disabled; prepared'} source maps for ${release}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await prepareSentryBuild();
}
