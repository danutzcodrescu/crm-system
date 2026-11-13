import { companyId, expect, signIn, test } from './fixtures';

test('municipality loaderData supplies metadata through SSR, client navigation and browser history', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  const path = `/municipalities/${companyId}`;
  const title = 'CRM System - Smoke Åby Municipality';
  const response = await page.goto(path);
  expect(response?.status()).toBe(200);
  expect(response).not.toBeNull();
  expect(await response!.text()).toContain(`<title>${title}</title>`);
  await expect(page).toHaveTitle(title);

  await page.goto('/initial-consultation');
  await page.waitForLoadState('networkidle');
  // A full document navigation would discard this marker, masking broken routing.
  await page.evaluate(() => Reflect.set(window, '__routerUpgradeDocument', true));
  await page.getByRole('link', { name: 'Smoke Åby', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${path}$`));
  await expect(page).toHaveTitle(title);
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Initial consultation', exact: true })).toBeVisible();
  await page.goForward();
  await expect(page).toHaveTitle(title);
  await expect(page.getByRole('heading', { name: /Smoke Åby/ })).toBeVisible();
  expect(await page.evaluate(() => Reflect.get(window, '__routerUpgradeDocument'))).toBe(true);
  expect(errors).toEqual([]);
});

test('authentication progressively enhances without JavaScript after the React 19 upgrade', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await signIn(page);
    await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('button', { name: 'logout' })).toBeVisible();
    await page.getByRole('button', { name: 'logout' }).click();
    await expect(page).toHaveURL(/\/signin$/);
    await page.goto('/municipalities');
    await expect(page).toHaveURL(/\/signin$/);
  } finally {
    await context.close();
  }
});

test('legacy DELETE logout still invalidates the session', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL });
  try {
    const page = await context.newPage();
    await signIn(page);
    const response = await context.request.fetch('/api/auth', { method: 'DELETE', maxRedirects: 0 });
    expect(response.status()).toBe(302);
    expect(response.headers().location).toBe('/signin');
    await page.goto('/municipalities');
    await expect(page).toHaveURL(/\/signin$/);
  } finally {
    await context.close();
  }
});
