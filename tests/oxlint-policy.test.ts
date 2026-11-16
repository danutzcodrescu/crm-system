import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';

const require = createRequire(import.meta.url);
const executable = join(dirname(require.resolve('oxlint/package.json')), 'bin/oxlint');

const cases = [
  {
    name: 'Drizzle DELETE requires a WHERE clause',
    rule: 'enforce-delete-with-where',
    source: 'export function remove(db, table) { return db.delete(table); }',
  },
  {
    name: 'Drizzle UPDATE requires a WHERE clause',
    rule: 'enforce-update-with-where',
    source: 'export function update(db, table) { return db.update(table).set({ name: "x" }); }',
  },
  {
    name: 'import sorting remains enforced',
    rule: 'simple-import-sort(imports)',
    source: 'import { join } from "node:path";\nimport { readFile } from "node:fs";\nexport { join, readFile };',
  },
  {
    name: 'unused imports remain errors',
    rule: 'no-unused-vars',
    source: 'import { join } from "node:path";\nexport const value = 1;',
  },
  {
    name: 'React hook call order remains checked',
    rule: 'rules-of-hooks',
    source:
      'import { useState } from "react";\nexport function Example({ active }) { if (active) useState(0); return <div />; }',
  },
  {
    name: 'upstream React compiler effect checks remain enabled',
    rule: 'set-state-in-effect',
    source:
      'import { useEffect, useState } from "react";\nexport function Example() { const [value, setValue] = useState(0); useEffect(() => { setValue(1); }, []); return <div>{value}</div>; }',
  },
  {
    name: 'upstream React compiler checks complex memo dependencies',
    rule: 'use-memo',
    source:
      'import { useMemo } from "react";\nexport function Example({ data }: { data: unknown }) { return useMemo(() => (data as { value: number }).value, [(data as { value: number }).value]); }',
  },
  {
    name: 'JSX accessibility remains checked',
    rule: 'alt-text',
    source: 'export function Example() { return <img src="example.png" />; }',
  },
  {
    name: 'deprecated React APIs remain checked',
    rule: 'no-deprecated',
    source: 'import React from "react";\nexport const Example = React.createClass({ render() { return null; } });',
  },
  {
    name: 'one safe mutation cannot hide a later unsafe mutation',
    rule: 'enforce-delete-with-where',
    source: 'export function run(db, table, condition) { db.delete(table).where(condition); return db.delete(table); }',
  },
];

for (const scenario of cases) {
  test(`Oxlint policy: ${scenario.name}`, async (context) => {
    const directory = await mkdtemp(join(tmpdir(), 'crm-oxlint-'));
    context.after(() => rm(directory, { recursive: true, force: true }));
    const filename = join(directory, 'policy.tsx');
    await writeFile(filename, scenario.source);
    const result = spawnSync(
      process.execPath,
      [executable, '--config', resolve('.oxlintrc.json'), '--format', 'json', '--no-ignore', filename],
      { encoding: 'utf8' },
    );
    assert.equal(result.status, 1, result.stderr || result.stdout);
    assert.ok(result.stdout.trimStart().startsWith('{'), result.stdout + result.stderr);
    const { diagnostics } = JSON.parse(result.stdout) as {
      diagnostics: { code: string; severity: string }[];
    };
    assert.ok(
      diagnostics.some(({ code, severity }) => code.includes(scenario.rule) && severity === 'error'),
      JSON.stringify(diagnostics),
    );
  });
}

for (const [name, source] of [
  [
    'bounded DELETE',
    'export function run(db, table, condition) { return db.delete(table).where(condition).returning(); }',
  ],
  [
    'bounded UPDATE',
    'export function run(db, table, condition) { return db.update(table).set({ name: "x" }).where(condition); }',
  ],
  ['non-SQL hash updates', 'export function run(hash, value) { return hash.update(value).digest("hex"); }'],
]) {
  test(`Oxlint policy allows ${name}`, async (context) => {
    const directory = await mkdtemp(join(tmpdir(), 'crm-oxlint-'));
    context.after(() => rm(directory, { recursive: true, force: true }));
    const filename = join(directory, 'policy.tsx');
    await writeFile(filename, source);
    const result = spawnSync(
      process.execPath,
      [executable, '--config', resolve('.oxlintrc.json'), '--format', 'json', '--no-ignore', filename],
      { encoding: 'utf8' },
    );
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.deepEqual(JSON.parse(result.stdout).diagnostics, []);
  });
}
