import { expect, test } from '@playwright/test';

test.describe('Authentication flow', () => {
  test('it redirects non authenticated user to signin', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByLabel('signout')).not.toBeVisible();
    await expect(page.getByText('Sign in to crm')).toBeVisible();
    await page.getByLabel('Username').fill(process.env.TEST_USER as string);
    await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD as string);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByLabel('signout')).toBeVisible();
    await expect(page.getByText('Sign in to crm')).not.toBeVisible();
  });

  test('it does not redirect when user already has cookie', async ({ page }) => {
    await page.goto('/signin');
    await page.getByLabel('Username').fill(process.env.TEST_USER as string);
    await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD as string);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByLabel('signout')).toBeVisible();
    await page.reload();
    await expect(page.getByLabel('signout')).toBeVisible();
    await expect(page.getByText('Sign in to crm')).not.toBeVisible();
  });
});
