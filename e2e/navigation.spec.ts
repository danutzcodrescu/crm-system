import { companyId, expect, test, year } from './fixtures';
import { redirectLocation } from './route-data';
import { dataUrl, pages } from './routes';

test('global search loads the API and navigates to municipality details', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.getByPlaceholder('Search for a municipality').fill('9901');
  await page.getByRole('option', { name: 'Smoke Åby (9901)', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/municipalities/${companyId}$`));
  await expect(page.getByRole('heading', { name: /Smoke Åby/ })).toBeVisible();
});

test('table filtering finds Swedish names and handles no matches', async ({ page }) => {
  await page.goto('/initial-consultation');
  await page.waitForLoadState('networkidle');
  // MUI drops its development-only icon test IDs in production. This unlabeled
  // filter is the first SVG in the column's controls, before the sort button.
  const filterToggle = page.getByRole('columnheader', { name: 'Municipality' }).locator('svg').first();
  await filterToggle.click();
  const filter = page.getByPlaceholder('Filter by Municipality', { exact: true });
  await filter.fill('Åby');
  await filter.press('Enter');
  await expect(page.getByRole('link', { name: 'Smoke Åby', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Smoke Örebro', exact: true })).not.toBeVisible();
  await filterToggle.click();
  await filter.fill('no-such-municipality');
  await filter.press('Enter');
  await expect(page.getByRole('link', { name: 'Smoke Åby', exact: true })).not.toBeVisible();
  await filterToggle.click();
  await filter.fill('');
  await filter.press('Enter');
  await expect(page.getByRole('link', { name: 'Smoke Åby', exact: true })).toBeVisible();
});

for (const path of ['/recurring-consultation', '/reporting', '/general-information', '/compensation', '/invoicing']) {
  test(`default year and year selector: ${path}`, async ({ page }) => {
    const defaultYear = ['/compensation', '/invoicing'].includes(path) ? year - 1 : year;
    await page.goto(path);
    await expect(page).toHaveURL(new RegExp(`${path}\\?year=${defaultYear}$`));
    await page.waitForLoadState('networkidle');
    await page.getByRole('combobox', { name: /Select the year/ }).click();
    const otherYear = defaultYear - 1;
    await page.getByRole('option', { name: String(otherYear), exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${path}\\?year=${otherYear}$`));
    await expect(page.getByRole('link', { name: 'Smoke Åby', exact: true }).first()).toBeVisible();
  });
}

test('municipality without contacts or scheduled consultations renders empty sections', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const response = await page.goto('/municipalities/10000000-0000-4000-8000-000000000003');
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { name: /Smoke Empty/ })).toBeVisible();
  await page.waitForLoadState('networkidle');
  expect(errors).toEqual([]);
});

for (const route of pages) {
  test(`narrow viewport smoke: ${route.path}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    expect((await page.goto(route.path))?.status()).toBe(200);
    await page.waitForLoadState('networkidle');
    await expect(
      page.getByRole('heading', { name: route.title, exact: !route.path.startsWith('/municipalities/') }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Stages menu' }).click();
    await expect(page.getByRole('menuitem', { name: 'Dashboard', exact: true })).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test('logout and layout actions reject anonymous requests', async ({ playwright, baseURL }) => {
  const anonymous = await playwright.request.newContext({ baseURL, storageState: { cookies: [], origins: [] } });
  try {
    for (const [path, file, method] of [
      ['/api/auth', 'api/auth/route.ts', 'DELETE'],
      ['/', 'views/layout.tsx', 'POST'],
      ['/statuses', 'views/statuses/route.tsx', 'POST'],
      ['/statuses', 'views/statuses/route.tsx', 'DELETE'],
    ]) {
      const response = await anonymous.fetch(dataUrl(path, file), { method, form: {}, maxRedirects: 0 });
      expect(await redirectLocation(response)).toBe('/signin');
    }
  } finally {
    await anonymous.dispose();
  }
});
