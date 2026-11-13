import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import test from 'node:test';

import type { Config } from '@react-router/dev/config';
import { loadConfigFromFile } from 'vite';

import routerConfig from '../react-router.config';

test('all stable React Router future flags are enabled for the v8 migration', () => {
  // Adding a stable flag to the installed router also requires adopting it here.
  const flags = {
    v8_middleware: true,
    v8_splitRouteModules: true,
    v8_viteEnvironmentApi: true,
    v8_passThroughRequests: true,
    v8_trailingSlashAwareDataRequests: true,
  } satisfies Record<Exclude<keyof NonNullable<Config['future']>, `unstable_${string}`>, true>;
  assert.deepEqual(routerConfig.future, flags);
});

test('Vite keeps the ESNext SSR target scoped to the server environment', async () => {
  const loaded = await loadConfigFromFile({ command: 'build', mode: 'production' }, resolve('vite.config.ts'));
  assert.ok(loaded);
  assert.equal(loaded.config.environments?.ssr?.build?.target, 'ESNext');
  assert.equal(loaded.config.build?.target, undefined);
  assert.equal(loaded.config.build?.sourcemap, true);
});

test('synthetic secrets require both development mode and the explicit smoke flag', async () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousSmoke = process.env.CRM_SMOKE_TEST;
  try {
    for (const [nodeEnv, smoke, enabled] of [
      ['development', '1', true],
      ['development', '', false],
      ['production', '1', false],
      ['test', '1', false],
    ] as const) {
      process.env.NODE_ENV = nodeEnv;
      process.env.CRM_SMOKE_TEST = smoke;
      const loaded = await loadConfigFromFile({ command: 'serve', mode: 'development' }, resolve('vite.config.ts'));
      assert.ok(loaded);
      const hasSyntheticSecrets = loaded.config.plugins?.some(
        (plugin) => plugin && typeof plugin === 'object' && 'name' in plugin && plugin.name === 'smoke-secrets',
      );
      assert.equal(hasSyntheticSecrets, enabled, `${nodeEnv} / CRM_SMOKE_TEST=${smoke}`);
    }
  } finally {
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
    if (previousSmoke === undefined) delete process.env.CRM_SMOKE_TEST;
    else process.env.CRM_SMOKE_TEST = previousSmoke;
  }
});
