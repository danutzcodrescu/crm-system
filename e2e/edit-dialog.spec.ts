import { expect, test, year } from './fixtures';

// Exercise both the formerly duplicated forms and an existing shared-hook user.
for (const { path, field, idField } of [
  { path: '/agreement', field: 'newAgreementLink', idField: 'id' },
  { path: '/initial-consultation', field: 'link', idField: 'id' },
  { path: `/reporting?year=${year}`, field: 'motivation', idField: 'companyId' },
]) {
  test(`edit dialog retains a failed draft and closes after retry: ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    const edit = page.getByRole('button', { name: /Edit Smoke Åby/ });
    await edit.click();
    const dialog = page.getByRole('dialog');
    const input = dialog.locator(`[name="${field}"]`);
    const draft = 'https://example.invalid/preserved-draft';
    await input.fill(draft);

    // Cause a real action validation failure without changing the DB or mocking
    // Single Fetch. Hidden record IDs are not subject to browser validation.
    const id = dialog.locator(`[name="${idField}"]`);
    const originalId = await id.inputValue();
    await id.evaluate((element: HTMLInputElement) => {
      element.value = '';
    });
    const rejected = page.waitForResponse(
      (response) => response.request().method() === 'PATCH' && response.status() === 400,
    );
    await dialog.getByRole('button', { name: 'Update', exact: true }).click();
    await rejected;
    await expect(dialog.getByRole('button', { name: 'Update', exact: true })).toBeEnabled();
    await expect(dialog).toBeVisible();
    await expect(input).toHaveValue(draft);

    await id.evaluate((element: HTMLInputElement, value) => {
      element.value = value;
    }, originalId);
    await dialog.getByRole('button', { name: 'Update', exact: true }).click();
    await expect(dialog).not.toBeVisible();

    // Reopen without a reload: fetcher.data still contains the previous success.
    await edit.click();
    await expect(input).toHaveValue(draft);
    await input.fill('https://example.invalid/unsaved');
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(dialog).not.toBeVisible();
    await edit.click();
    await expect(input).toHaveValue(draft);
  });
}

test('completion of a cancelled save does not close a newly opened draft', async ({ page }) => {
  await page.goto('/agreement');
  await page.waitForLoadState('networkidle');
  const edit = page.getByRole('button', { name: /Edit Smoke Åby/ });
  await edit.click();
  const dialog = page.getByRole('dialog');
  await dialog.locator('[name="newAgreementLink"]').fill('https://example.invalid/older-save');

  // Hold only the mutation, so opening another editing session happens before
  // the old save completes. No sleeps or mocked action responses are needed.
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  let notify!: () => void;
  const submitted = new Promise<void>((resolve) => {
    notify = resolve;
  });
  await page.route('**/agreement.data*', async (route) => {
    if (route.request().method() === 'PATCH') {
      notify();
      await held;
    }
    await route.continue();
  });
  try {
    await dialog.getByRole('button', { name: 'Update', exact: true }).click();
    await submitted;
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    await edit.click();
    await dialog.locator('[name="newAgreementLink"]').fill('https://example.invalid/newer-draft');
    const completed = page.waitForResponse((response) => response.request().method() === 'PATCH');
    release();
    await completed;
    await expect(dialog.getByRole('button', { name: 'Update', exact: true })).toBeEnabled();
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('[name="newAgreementLink"]')).toHaveValue('https://example.invalid/newer-draft');
  } finally {
    release();
    await page.unrouteAll({ behavior: 'wait' });
  }
});

test('global create retains a rejected draft and closes on a successful retry', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Create new', exact: true }).click();
  const item = page.getByRole('menuitem', { name: 'New log', exact: true });
  const optionsLoaded = page.waitForResponse((response) => response.url().includes('/api/municipalities.data'));
  await item.hover();
  await optionsLoaded;
  await item.click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('combobox', { name: 'Municipality' }).click();
  await page.getByRole('option', { name: /Smoke Åby/ }).click();
  await dialog.locator('[name="description"]').fill('Global create preserved draft');
  // MUI's select is controlled and restores its hidden input on render. Clear
  // a required parameter from the outgoing request instead, keeping the actual
  // action/validation response and the visible draft real.
  await page.route('**/api/logs.data*', async (route) => {
    if (route.request().method() === 'POST') {
      const body = new URLSearchParams(route.request().postData()!);
      body.set('companyId', '');
      await route.continue({ postData: body.toString() });
    } else {
      await route.continue();
    }
  });
  const rejected = page.waitForResponse(
    (response) => response.request().method() === 'POST' && response.status() === 400,
  );
  await dialog.getByRole('button', { name: 'Create', exact: true }).click();
  await rejected;
  await expect(dialog.getByRole('button', { name: 'Create', exact: true })).toBeEnabled();
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('[name="description"]')).toHaveValue('Global create preserved draft');

  await page.unrouteAll({ behavior: 'wait' });
  await dialog.getByRole('button', { name: 'Create', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('alert')).toContainText('Log created successfully');
});
