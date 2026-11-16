import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';

import pkg from '../package.json';

const require = createRequire(import.meta.url);

const compiler = join(dirname(require.resolve('typescript/package.json')), 'bin/tsc');

test('the native TypeScript 7 compiler runs without a direct legacy API bridge', () => {
  const version = execFileSync(process.execPath, [compiler, '--version'], { encoding: 'utf8' });
  assert.match(version, /^Version 7\./);
  assert.match(pkg.devDependencies.typescript, /^\^7\./);
  assert.ok(!('@typescript/native' in pkg.devDependencies));
  assert.ok(!('@typescript-eslint/parser' in pkg.devDependencies));
});

for (const filename of ['tsconfig.json', 'tsconfig-express.json']) {
  test(`${filename} keeps explicit Node types and relative aliases without removed baseUrl`, () => {
    const config = JSON.parse(
      execFileSync(process.execPath, [compiler, '--showConfig', '-p', resolve(filename)], { encoding: 'utf8' }),
    );
    assert.ok(!('baseUrl' in config.compilerOptions));
    assert.ok(config.compilerOptions.types.includes('node'));
    assert.deepEqual(config.compilerOptions.paths['~/*'], ['./app/*']);
  });
}
