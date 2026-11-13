import { companyId, expect, test, year } from './fixtures';

test('PDF generation route renders a complete compensation PDF', async ({ request }) => {
  const response = await request.get(`/municipalities/${companyId}/${year}.pdf`);
  expect(response.status(), await response.text()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/pdf');
  expect(response.headers()['content-disposition']).toContain('attachment;');
  expect(response.headers()['content-disposition']).toContain('Smoke');
  expect(response.headers()['content-disposition']).toContain(`${year}.pdf`);
  const encodedFilename = response.headers()['content-disposition'].split("filename*=UTF-8''")[1];
  expect(decodeURIComponent(encodedFilename)).toBe(`Smoke Åby ersättning ${year}.pdf`);
  const document = await response.body();
  expect(document.subarray(0, 5).toString()).toBe('%PDF-');
  expect(document.subarray(-30).toString()).toContain('%%EOF');
  expect(document.length).toBeGreaterThan(1_000);
});

test('compensation PDF is protected without a session', async ({ playwright, baseURL }) => {
  const anonymous = await playwright.request.newContext({ baseURL, storageState: { cookies: [], origins: [] } });
  try {
    const response = await anonymous.get(`/municipalities/${companyId}/${year}.pdf`, { maxRedirects: 0 });
    expect(response.status()).toBe(302);
    expect(response.headers().location).toBe('/signin');
    expect(response.headers()['content-type'] || '').not.toContain('application/pdf');
  } finally {
    await anonymous.dispose();
  }
});
