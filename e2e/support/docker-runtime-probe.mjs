import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import process from 'node:process';

assert.equal(process.versions.node.split('.')[0], '26', 'production image must run Node 26');
assert.match((await import('react-router/package.json', { with: { type: 'json' } })).default.version, /^8\./);
assert.match((await import('react')).version, /^19\./);

const { hash, verify } = await import('@node-rs/argon2');
const password = 'synthetic-docker-runtime-probe';
assert(await verify(await hash(password), password), 'native Argon2 hash/verify must work');

for (const name of [
  'googleapis',
  '@infisical/sdk',
  '@react-pdf/renderer',
  '@react-router/express',
  '@sentry/react-router',
  'xlsx',
]) {
  await import(name);
  console.log('Import passed:', name);
}

for (const path of ['dist/server/index.js', 'dist/cmd/server.js', 'dist/client/assets']) {
  assert(existsSync(path), `production artifact is missing: ${path}`);
}
for (const name of ['typescript', '@react-router/dev', '@remix-run/react', '@remix-run/node']) {
  let installed = false;
  try {
    import.meta.resolve(name);
    installed = true;
  } catch {
    // Expected: dev dependencies and the replaced Remix runtime are pruned.
  }
  assert(!installed, `${name} must not be installed in the production image`);
}
assert(!existsSync('e2e'), 'production image must not contain the synthetic test loaders');
assert(!existsSync('/smoke'), 'runtime probe must run without the test-only secrets replacement');

console.log(
  JSON.stringify({
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    argon2: 'hash/verify passed',
    productionArtifacts: 'present',
    devDependencies: 'absent',
    syntheticSecretsLoader: 'absent',
  }),
);
