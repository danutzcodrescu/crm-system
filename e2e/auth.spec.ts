import { expect, signIn, test } from './fixtures';

test.use({ storageState: { cookies: [], origins: [] } });

test('real login survives reload, then logout invalidates the session', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/signin$/);
  await signIn(page);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'logout' }).click();
  await expect(page).toHaveURL(/\/signin$/);
  await page.goto('/municipalities');
  await expect(page).toHaveURL(/\/signin$/);
});

test('login rejects empty and incorrect credentials', async ({ page }) => {
  await page.goto('/signin');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByText('Username or password field cannot be empty')).toBeVisible();
  await page.getByLabel('Username').fill('not-a-user');
  await page.getByLabel('Password', { exact: true }).fill('incorrect');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByText('There was an issue when trying to login')).toBeVisible();
});

test('signup validates passwords and creates a usable account', async ({ page }) => {
  const username = `smoke_signup_${Date.now()}`;
  await page.goto('/signup');
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password', { exact: true }).fill('new-smoke-password');
  await page.getByLabel('Confirm Password').fill('mismatch');
  await page.getByRole('button', { name: 'Sign up', exact: true }).click();
  await expect(page.getByText('Passwords do not match').first()).toBeVisible();
  await page.getByLabel('Confirm Password').fill('new-smoke-password');
  await page.getByRole('button', { name: 'Sign up', exact: true }).click();
  await expect(page.getByRole('button', { name: 'logout' })).toBeVisible();
  await page.getByRole('button', { name: 'logout' }).click();
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password', { exact: true }).fill('new-smoke-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();
});
