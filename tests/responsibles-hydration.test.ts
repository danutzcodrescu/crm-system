import assert from 'node:assert/strict';
import test from 'node:test';

import { ThemeProvider } from '@mui/material';
import { load } from 'cheerio';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { createMemoryRouter, RouterProvider, useFetcher } from 'react-router';

import { ResponsiblesTable } from '../app/components/municipality/ResponsiblesTable';
import { theme } from '../app/utils/theme';

function ContactTable() {
  const fetcher = useFetcher();
  return createElement(ResponsiblesTable, {
    companyId: 'synthetic',
    fetcher,
    data: [
      { id: 'contact', companyId: 'synthetic', name: 'Synthetic contact', updatedAt: new Date('2026-11-16T23:30:00Z') },
    ],
  });
}

function renderedCells(timeZone: string) {
  process.env.TZ = timeZone;
  const router = createMemoryRouter([{ path: '/', Component: ContactTable }]);
  try {
    const html = renderToString(createElement(ThemeProvider, { theme }, createElement(RouterProvider, { router })));
    const $ = load(html);
    $('style').remove();
    return $('tbody td')
      .map((_index, cell) => $(cell).text())
      .get();
  } finally {
    router.dispose();
  }
}

test('municipality contact cells render identical text across server/browser time zones', () => {
  const previous = process.env.TZ;
  try {
    const utc = renderedCells('UTC');
    assert.deepEqual(renderedCells('Europe/Stockholm'), utc);
    assert.deepEqual(renderedCells('America/Los_Angeles'), utc);
    assert.ok(utc.includes('2026-11-17'), 'update date uses the application Stockholm date format');
    assert.ok(!utc.some((cell) => cell.includes('GMT')), 'never render a raw Date.toString()');
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});
