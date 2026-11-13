import { readFile } from 'node:fs/promises';

import { companyId, expect, test, year } from './fixtures';
import { readRouteData, redirectLocation } from './route-data';
import { apis, dataUrl, editablePages, pages } from './routes';

test('every route registration has an explicit smoke scenario', async () => {
  const config = await readFile('app/routes.ts', 'utf8');
  const registered = [...config.matchAll(/(?:route\('[^']*', |index\()'([^']+)'/g)].map((match) => match[1]);
  const covered = [
    ...pages.map(({ file }) => file),
    ...apis.map(({ file }) => file),
    'views/login/route.tsx',
    'views/signup/route.tsx',
    'api/auth/route.ts',
    // Both layouts are rendered and authenticated in page scenarios.
    'views/layout.tsx',
    'views/municipalities/layout.tsx',
  ];
  expect(registered.sort()).toEqual(covered.sort());
});

test('Express health endpoint', async ({ request }) => {
  const response = await request.get('/health');
  expect(response.status()).toBe(200);
  expect(await response.text()).toBe('OK');
});

test('database uses the Dockerfile Swedish locale and sorting', async ({ database }) => {
  const {
    rows: [settings],
  } = await database.query('SELECT datcollate, datctype FROM pg_database WHERE datname = current_database()');
  expect(settings.datcollate).toBe('sv_SE.utf8');
  expect(settings.datctype).toBe('sv_SE.utf8');
  const sorted = await database.query(
    "SELECT name FROM (VALUES ('Örebro'), ('Zulu'), ('Älmhult'), ('Åby')) names(name) ORDER BY name",
  );
  expect(sorted.rows.map(({ name }) => name)).toEqual(['Zulu', 'Åby', 'Älmhult', 'Örebro']);
});

for (const route of pages) {
  test(`page smoke: ${route.path}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('response', (response) => {
      if (response.status() >= 500 && new URL(response.url()).origin === process.env.SMOKE_BASE_URL) {
        errors.push(`${response.status()} ${response.url()}`);
      }
    });
    const response = await page.goto(route.path);
    await page.waitForLoadState('networkidle');
    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole('heading', { name: route.title, exact: !route.path.startsWith('/municipalities/') }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'logout' })).toBeVisible();
    if (route.table) await expect(page.getByRole('table').first()).toBeVisible();
    if (route.table && !route.path.startsWith('/municipalities/') && route.path !== '/logs') {
      await expect(page.getByRole('link', { name: 'Smoke Åby', exact: true }).first()).toBeVisible();
    }
    // Exercise hydrated controls, not just server-rendered HTML.
    await page.getByRole('button', { name: 'Stages menu' }).click();
    await expect(page.getByRole('menuitem', { name: 'Dashboard', exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    expect(errors).toEqual([]);
  });

  test(`anonymous page guard: ${route.path}`, async ({ playwright, baseURL }) => {
    const anonymous = await playwright.request.newContext({ baseURL, storageState: { cookies: [], origins: [] } });
    try {
      // Direct loader access must be protected too (a parent layout alone is insufficient).
      const response = await anonymous.get(dataUrl(route.path, route.file), { maxRedirects: 0 });
      expect(await redirectLocation(response)).toBe('/signin');
    } finally {
      await anonymous.dispose();
    }
  });
}

for (const route of apis) {
  test(`API smoke: ${route.method} ${route.path}`, async ({ request }) => {
    const response = await request.fetch(dataUrl(route.path, route.file), {
      method: route.method,
      ...(route.upload
        ? { multipart: { year: String(year), unrelated: 'no file' } }
        : route.method !== 'GET'
          ? { form: route.form || {} }
          : {}),
    });
    expect(response.status(), await response.text()).toBe(route.status);
    const body = await readRouteData(response);
    if (route.message) expect(body.message || body.error).toBe(route.message);
    else expect(body.severity).toBe('success');
    if (route.path === '/api/municipalities')
      expect(body.message).toEqual(expect.arrayContaining([expect.objectContaining({ id: companyId })]));
    if (route.path === '/api/reminders')
      expect(body.message).toEqual(expect.objectContaining({ reminders: expect.any(Array) }));
  });

  test(`anonymous API guard: ${route.method} ${route.path}`, async ({ playwright, baseURL }) => {
    const anonymous = await playwright.request.newContext({ baseURL, storageState: { cookies: [], origins: [] } });
    try {
      const response = await anonymous.fetch(dataUrl(route.path, route.file), {
        method: route.method,
        maxRedirects: 0,
        ...(route.method !== 'GET' ? { form: {} } : {}),
      });
      expect(await redirectLocation(response)).toBe('/signin');
    } finally {
      await anonymous.dispose();
    }
  });
}

for (const route of editablePages) {
  test(`anonymous action guard: PATCH ${route.path}`, async ({ playwright, baseURL }) => {
    const anonymous = await playwright.request.newContext({ baseURL, storageState: { cookies: [], origins: [] } });
    try {
      const response = await anonymous.patch(dataUrl(route.path, route.file), { form: {}, maxRedirects: 0 });
      expect(await redirectLocation(response)).toBe('/signin');
    } finally {
      await anonymous.dispose();
    }
  });
}

test('unknown URL returns a real 404', async ({ request }) => {
  expect((await request.get('/not-a-real-smoke-route')).status()).toBe(404);
});
