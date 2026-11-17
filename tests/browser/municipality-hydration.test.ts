import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

import express from 'express';
import { chromium } from 'playwright';
import { build } from 'vite';

test('real municipality UI hydrates across browser time zones without database access', async (t) => {
  await mkdir('playwright/.cache', { recursive: true });
  const directory = await mkdtemp(resolve('playwright/.cache/municipality-hydration-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const previous = process.env.NODE_ENV;
  const previousTimeZone = process.env.TZ;
  process.env.NODE_ENV = 'development';
  process.env.TZ = 'UTC';
  t.after(() => {
    if (previous === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previous;
  });
  t.after(() => {
    if (previousTimeZone === undefined) delete process.env.TZ;
    else process.env.TZ = previousTimeZone;
  });
  for (const target of ['server', 'client']) {
    await build({
      configFile: false,
      envDir: false,
      publicDir: false,
      logLevel: 'error',
      resolve: { tsconfigPaths: true },
      plugins: [
        {
          name: 'municipality-ui-only',
          enforce: 'pre',
          transform(code, id) {
            if (id !== resolve('app/views/municipalities/municipality.tsx')) return;
            // Equivalent boundary to framework client compilation: remove only
            // server loader/meta exports and their imports, not the rendered view.
            const loader = code.indexOf('export async function loader');
            const component = code.indexOf('export default function Municipality');
            if (loader < 0 || component <= loader)
              throw new Error('Update the UI harness for the changed route exports');
            const head = code.slice(0, loader);
            const view = code.slice(component);
            return (
              head.replace(/^import[\s\S]*?from (['"])([^'"]+)\1;/gm, (statement, _quote, source) =>
                source.includes('.server') ? '' : statement,
              ) + view
            );
          },
          resolveId(source) {
            if (/\.server(?:\.[tj]sx?)?$/.test(source))
              throw new Error(`Hydration harness must not load server dependencies: ${source}`);
          },
        },
      ],
      define: { 'process.env.NODE_ENV': JSON.stringify('development') },
      build: {
        ssr: target === 'server',
        outDir: resolve(directory, target),
        lib: {
          entry: resolve(`tests/browser/fixtures/${target}.tsx`),
          formats: ['es'],
          fileName: () => `${target}.js`,
        },
        rolldownOptions: { output: { entryFileNames: `${target}.js` } },
        minify: false,
      },
    });
  }
  const { render } = await import(pathToFileURL(resolve(directory, 'server/server.js')).href);
  const markup = render();
  assert.match(markup, /Synthetic municipality/, 'SSR must render the real view');
  const app = express();
  app.use(express.static(resolve(directory, 'client')));
  app.get('/', (_req, res) => res.type('html').send(markup));
  const server = app.listen(0, '127.0.0.1');
  t.after(() => new Promise<void>((done) => server.close(() => done())));
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const browser = await chromium.launch();
  t.after(() => browser.close());
  for (const [locale, timezoneId] of [
    ['en-US', 'UTC'],
    ['sv-SE', 'Europe/Stockholm'],
    ['en-US', 'America/Los_Angeles'],
  ]) {
    const context = await browser.newContext({ locale, timezoneId });
    try {
      const page = await context.newPage();
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      await page.goto(`http://127.0.0.1:${address.port}`);
      await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
      await page.waitForLoadState('networkidle');
      const recovered = await page.evaluate(() => JSON.parse(document.documentElement.dataset.hydrationErrors || '[]'));
      assert.deepEqual(recovered, [], `${locale}/${timezoneId}: recoverable hydration errors`);
      assert.deepEqual(errors, [], `${locale}/${timezoneId}: browser errors`);
    } finally {
      await context.close();
    }
  }
});
