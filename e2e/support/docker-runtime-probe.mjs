import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
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
const release = JSON.parse(readFileSync('dist/sentry-release.json', 'utf8')).release;
assert(release && !release.includes('undefined'), 'production release must be baked into the image');
assert.equal(process.env.SENTRY_AUTH_TOKEN, undefined, 'upload token must not be in the runtime environment');
for (const file of readdirSync('dist/client', { recursive: true })) {
  assert(!file.endsWith('.map'), `public source map must not ship: ${file}`);
}
for (const file of ['dist/server/index.js', 'dist/cmd/server.js']) {
  assert.match(readFileSync(file, 'utf8'), /debugId/, `missing Sentry debug ID: ${file}`);
  const map = JSON.parse(readFileSync(`${file}.map`, 'utf8'));
  assert(map.debug_id || map.debugId, `missing source-map debug ID: ${file}`);
  assert(map.sourcesContent?.length, `source content is missing: ${file}`);
}
for (const file of ['.env.production', '.env.sentry-build-plugin', '.sentryclirc', 'app', 'tests', 'tooling']) {
  assert(!existsSync(file), `build-only files must not be in the production image: ${file}`);
}
for (const name of [
  'typescript',
  'oxlint',
  '@typescript/native',
  '@react-router/dev',
  '@remix-run/react',
  '@remix-run/node',
]) {
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
    sourceMaps: 'private server maps and debug IDs present; public maps absent',
    release,
  }),
);
