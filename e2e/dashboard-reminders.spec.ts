import { expect, test } from './fixtures';

const oldReminderId = '50000000-0000-4000-8000-000000000099';

test.beforeEach(async ({ database }) => {
  await database.query(
    `INSERT INTO reminders (id, company_id, description, due_date)
     VALUES ($1, '10000000-0000-4000-8000-000000000002', 'Older reminder', CURRENT_DATE - INTERVAL '30 days')`,
    [oldReminderId],
  );
});

test.afterEach(async ({ database }) => {
  await database.query('DELETE FROM logs WHERE description = $1', ['Reminders revalidation test']);
  await database.query('DELETE FROM reminders WHERE id = $1', [oldReminderId]);
});

test('all reminders are revalidated after an action without another synchronization effect', async ({
  page,
  database,
}) => {
  await page.goto('/');
  // SSR makes this JS-only button visible before React attaches its handler.
  await page.waitForLoadState('networkidle');
  const reminders = page.getByRole('region', { name: 'Reminders', exact: true });
  const older = reminders.getByRole('link', { name: 'Smoke Örebro', exact: true });
  await reminders.getByRole('button', { name: 'Show all reminders', exact: true }).click();
  await expect(older).toBeVisible();
  await database.query('UPDATE reminders SET status = true WHERE id = $1', [oldReminderId]);

  // Complete a normal UI action. React Router should revalidate both the
  // dashboard loader and the already-loaded reminders fetcher automatically.
  await page.getByRole('button', { name: 'Create new', exact: true }).click();
  const item = page.getByRole('menuitem', { name: 'New log', exact: true });
  const optionsLoaded = page.waitForResponse((response) => response.url().includes('/api/municipalities.data'));
  await item.hover();
  await optionsLoaded;
  await item.click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('combobox', { name: 'Municipality' }).click();
  await page.getByRole('option', { name: /Smoke Åby/ }).click();
  await dialog.locator('[name="description"]').fill('Reminders revalidation test');
  const revalidated = page.waitForResponse((response) => response.url().includes('/api/reminders.data'));
  await dialog.getByRole('button', { name: 'Create', exact: true }).click();
  await revalidated;
  await expect(dialog).not.toBeVisible();
  await expect(older).toHaveCount(0);
  await expect(reminders.getByRole('button', { name: 'Show only recent reminders', exact: true })).toBeVisible();
});

test('dashboard toggles between recent and all reminders and refreshes on reopening', async ({ page, database }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const reminders = page.getByRole('region', { name: 'Reminders', exact: true });
  const older = reminders.getByRole('link', { name: 'Smoke Örebro', exact: true });
  await expect(older).toHaveCount(0);
  await reminders.getByRole('button', { name: 'Show all reminders', exact: true }).click();
  await expect(older).toBeVisible();
  await expect(reminders.getByRole('status')).toHaveCount(0);

  await reminders.getByRole('button', { name: 'Show only recent reminders', exact: true }).click();
  await expect(older).toHaveCount(0);

  // A fresh load must reflect changes, not just reuse the previous fetcher data.
  await database.query('UPDATE reminders SET status = true WHERE id = $1', [oldReminderId]);
  const loaded = page.waitForResponse((response) => response.url().includes('/api/reminders.data'));
  await reminders.getByRole('button', { name: 'Show all reminders', exact: true }).click();
  await loaded;
  await expect(reminders.getByRole('status')).toHaveCount(0);
  await expect(older).toHaveCount(0);
  await expect(reminders.getByRole('link', { name: 'Smoke Åby', exact: true })).toBeVisible();
});

test('a late all-reminders response cannot replace the selected recent view', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const reminders = page.getByRole('region', { name: 'Reminders', exact: true });
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/api/reminders.data*', async (route) => {
    await held;
    await route.continue();
  });
  try {
    await reminders.getByRole('button', { name: 'Show all reminders', exact: true }).click();
    await expect(reminders.getByRole('status')).toContainText('Loading reminders');
    await reminders.getByRole('button', { name: 'Show only recent reminders', exact: true }).click();
    await expect(reminders.getByRole('status')).toHaveCount(0);
    const loaded = page.waitForResponse((response) => response.url().includes('/api/reminders.data'));
    release();
    await loaded;
    await expect(reminders.getByRole('button', { name: 'Show all reminders', exact: true })).toBeVisible();
    await expect(reminders.getByRole('link', { name: 'Smoke Örebro', exact: true })).toHaveCount(0);
    await expect(reminders.getByRole('link', { name: 'Smoke Åby', exact: true })).toBeVisible();
  } finally {
    release();
    await page.unrouteAll({ behavior: 'wait' });
  }
});
