import type { BrowserContext, Page } from '@playwright/test';
import { expect, test as base } from '@playwright/test';
import pg from 'pg';

export const companyId = '10000000-0000-4000-8000-000000000001';
export const contactId = '40000000-0000-4000-8000-000000000001';
export const logId = '60000000-0000-4000-8000-000000000001';
export const year = new Date().getUTCFullYear();

export async function signIn(page: Page) {
  await page.goto('/signin');
  await page.getByLabel('Username').fill('smoke_user');
  await page.getByLabel('Password', { exact: true }).fill('smoke-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('button', { name: 'logout' })).toBeVisible();
}

type State = Awaited<ReturnType<BrowserContext['storageState']>>;
export const test = base.extend<{ database: pg.Client }, { signedInState: State }>({
  // Playwright requires destructuring even when a fixture has no dependencies.
  // eslint-disable-next-line no-empty-pattern
  baseURL: async ({}, provide) => {
    await provide(process.env.SMOKE_BASE_URL);
  },
  signedInState: [
    async ({ browser }, provide) => {
      const context = await browser.newContext({ baseURL: process.env.SMOKE_BASE_URL });
      try {
        await signIn(await context.newPage());
        await provide(await context.storageState());
      } finally {
        await context.close();
      }
    },
    { scope: 'worker' },
  ],
  storageState: async ({ signedInState }, provide) => {
    await provide(signedInState);
  },
  // eslint-disable-next-line no-empty-pattern
  database: async ({}, provide) => {
    const database = new pg.Client({ connectionString: process.env.SMOKE_DATABASE_URL });
    await database.connect();
    try {
      await provide(database);
    } finally {
      await database.end();
    }
  },
});

export { expect } from '@playwright/test';
