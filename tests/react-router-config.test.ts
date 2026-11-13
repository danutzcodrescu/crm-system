import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import test from 'node:test';

import { loadConfigFromFile } from 'vite';

import pkg from '../package.json';
import routerConfig from '../react-router.config';

test('React Router 8 keeps SSR, route splitting and the production output directory', () => {
  assert.equal(routerConfig.ssr, true);
  assert.equal(routerConfig.splitRouteModules, true);
  assert.equal(routerConfig.buildDirectory, 'dist');
  assert.ok(!('future' in routerConfig), 'obsolete v8 future flags must not be restored');
});

test('React Router runtime, Express adapter and build tooling stay on matching v8 versions', () => {
  const version = pkg.dependencies['react-router'];
  assert.match(version, /^\^8\./);
  assert.equal(pkg.dependencies['@react-router/node'], version);
  assert.equal(pkg.dependencies['@react-router/express'], version);
  assert.equal(pkg.devDependencies['@react-router/dev'], version);
  assert.equal(pkg.dependencies.react, pkg.dependencies['react-dom']);
  assert.ok(!('react-router-dom' in pkg.dependencies));
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
