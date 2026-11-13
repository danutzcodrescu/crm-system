import { load } from 'cheerio';

import { expect, test } from './fixtures';

test.describe('production Docker image', () => {
  test.skip(!process.env.CRM_SMOKE_IMAGE, 'Requires the compiled production image, not Vite middleware mode');

  test('retains Secure and HttpOnly session cookies', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();
    const cookie = (await page.context().cookies()).find(({ name }) => name === 'crm_session');
    expect(cookie).toMatchObject({ secure: true, httpOnly: true, sameSite: 'Lax' });
  });

  test('serves fingerprinted production assets with immutable caching', async ({ page }) => {
    const response = await page.goto('/');
    const html = await response!.text();
    expect(html).not.toContain('/@vite/client');
    expect(html).not.toContain('/app/entry.client.tsx');
    // Inspect the actual document response: preload hints are transient during
    // hydration, so looking for one in the live DOM introduces a timing race.
    const script = load(html)('link[rel="modulepreload"][href*="/assets/entry.client-"]').attr('href');
    expect(script).toMatch(/^\/assets\/entry\.client-[\w-]+\.js$/);
    const asset = await page.request.get(script!);
    expect(asset.status()).toBe(200);
    expect(asset.headers()['cache-control']).toContain('immutable');
    expect(asset.headers()['cache-control']).toContain('max-age=31536000');
    expect(asset.headers()['content-type']).toContain('javascript');
  });

  test('production health response omits the Express identification header', async ({ request }) => {
    const response = await request.get('/health');
    expect(response.status()).toBe(200);
    expect(await response.text()).toBe('OK');
    expect(response.headers()['x-powered-by']).toBeUndefined();
  });
});
