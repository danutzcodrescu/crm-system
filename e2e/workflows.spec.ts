/* eslint-disable drizzle/enforce-delete-with-where -- These are Playwright HTTP DELETE requests, not Drizzle queries. */
import { utils, write } from 'xlsx';

import { companyId, expect, logId, test, year } from './fixtures';
import { dataUrl, pages } from './routes';

const edits = [
  {
    path: '/initial-consultation',
    field: 'link',
    value: 'https://example.invalid/updated',
    sql: 'SELECT link AS value FROM initial_consultations WHERE company_id = $1',
    key: companyId,
  },
  {
    path: '/agreement',
    field: 'newAgreementLink',
    value: 'https://example.invalid/agreement-updated',
    sql: 'SELECT new_agreement_link_to_agreement AS value FROM agreements WHERE company_id = $1',
    key: companyId,
  },
  {
    path: '/reporting',
    field: 'motivation',
    value: 'Smoke updated motivation',
    sql: `SELECT motivation AS value FROM reporting WHERE company_id = $1 AND year = ${year}`,
    key: companyId,
  },
  {
    path: '/general-information',
    field: 'inhabitants',
    value: '12345',
    sql: `SELECT inhabitants::text AS value FROM general_information WHERE company_id = $1 AND year = ${year}`,
    key: companyId,
  },
  {
    path: '/invoicing',
    field: 'invoiceAmount',
    value: '15678.25',
    sql: `SELECT invoice_amount::text AS value FROM invoicing WHERE company_id = $1 AND year = ${year}`,
    key: companyId,
  },
  {
    path: '/statuses',
    field: 'statusName',
    value: 'Smoke active updated',
    sql: 'SELECT name AS value FROM statuses WHERE id = $1',
    key: '1',
  },
  {
    path: '/years',
    field: 'adminFee',
    value: '9100',
    sql: 'SELECT admin_fee::text AS value FROM years WHERE name = $1',
    key: String(year),
  },
];

for (const edit of edits) {
  test(`edit, persist and reopen: ${edit.path}`, async ({ page, database }) => {
    const route = pages.find(({ path }) => path.split('?')[0] === edit.path)!;
    await page.goto(route.path);
    await page.waitForLoadState('networkidle');
    const editButton =
      edit.path === '/statuses' ? 'Edit Smoke active' : edit.path === '/years' ? `Edit ${year}` : /Edit Smoke Åby/;
    await page.getByRole('button', { name: editButton, exact: typeof editButton === 'string' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.locator(`[name="${edit.field}"]`).fill(edit.value);
    await dialog.getByRole('button', { name: 'Update', exact: true }).click();
    await expect(dialog).not.toBeVisible();
    expect((await database.query(edit.sql, [edit.key])).rows[0].value).toBe(edit.value);
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page
      .getByRole('button', {
        name: edit.path === '/statuses' ? `Edit ${edit.value}` : editButton,
        exact: typeof editButton === 'string',
      })
      .click();
    await expect(page.getByRole('dialog').locator(`[name="${edit.field}"]`)).toHaveValue(edit.value);
  });
}

test('recurring consultation form persists the completion flag', async ({ page, database }) => {
  await page.goto(`/recurring-consultation?year=${year}`);
  await page.waitForLoadState('networkidle');
  for (const value of [false, true]) {
    await page.getByRole('button', { name: /Edit Smoke Åby/ }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('combobox', { name: /^Consultation form completed/ }).click();
    await page.getByRole('option', { name: value ? 'Yes' : 'No', exact: true }).click();
    await dialog.getByRole('button', { name: 'Update', exact: true }).click();
    await expect(dialog).not.toBeVisible();
    const result = await database.query(
      'SELECT consultation_form_completed FROM recurring_consultations WHERE company_id = $1 AND year = $2',
      [companyId, year],
    );
    expect(result.rows[0].consultation_form_completed).toBe(value);
  }
});

test('log create, edit and delete actually persist', async ({ request, database }) => {
  const url = dataUrl(`/api/logs/${companyId}`, 'api/notes-log/companyLog.ts');
  const created = await request.post(url, { form: { description: 'Smoke CRUD log', date: `${year}-03-04` } });
  expect((await created.json()).severity).toBe('success');
  const {
    rows: [log],
  } = await database.query('SELECT id FROM logs WHERE description = $1', ['Smoke CRUD log']);
  expect(log.id).toBeTruthy();
  const logUrl = dataUrl(`/api/logs/${companyId}/${log.id}`, 'api/notes-log/log.ts');
  expect(
    (
      await (
        await request.patch(logUrl, { form: { description: 'Smoke CRUD log edited', date: `${year}-03-05` } })
      ).json()
    ).severity,
  ).toBe('success');
  expect((await database.query('SELECT description FROM logs WHERE id = $1', [log.id])).rows[0].description).toBe(
    'Smoke CRUD log edited',
  );
  expect((await (await request.delete(logUrl)).json()).severity).toBe('success');
  expect((await database.query('SELECT id FROM logs WHERE id = $1', [log.id])).rowCount).toBe(0);
});

test('global log action creates a log with a linked reminder', async ({ request, database }) => {
  const response = await request.post(dataUrl('/api/logs', 'api/notes-log/layout.tsx'), {
    form: {
      companyId,
      description: 'Smoke global log',
      date: `${year}-03-04`,
      reminderDueDate: `${year}-12-20`,
      reminderDescription: 'Smoke linked reminder',
    },
  });
  expect((await response.json()).severity).toBe('success');
  const result = await database.query(
    'SELECT r.description FROM logs l JOIN reminders r ON l.reminder_id = r.id WHERE l.description = $1',
    ['Smoke global log'],
  );
  expect(result.rows[0].description).toBe('Smoke linked reminder');
});

test('contacts can be created globally, updated and deleted', async ({ request, database }) => {
  const response = await request.post(dataUrl('/api/responsibles', 'api/responsibles/responsibles.tsx'), {
    form: { companyId, name: 'Smoke CRUD contact', email: 'crud@example.invalid', phoneNumber: '123', title: 'Tester' },
  });
  expect((await response.json()).severity).toBe('success');
  const {
    rows: [contact],
  } = await database.query('SELECT id FROM responsibles WHERE email = $1', ['crud@example.invalid']);
  const url = dataUrl(
    `/api/municipalities/${companyId}/responsibles/${contact.id}`,
    'api/municipalities/responsible.ts',
  );
  expect(
    (
      await (
        await request.patch(url, {
          form: {
            name: 'Smoke CRUD edited',
            email: 'crud@example.invalid',
            phoneNumber: '456',
            mobileNumber: '789',
            title: 'Updated',
          },
        })
      ).json()
    ).severity,
  ).toBe('success');
  expect(
    (await database.query('SELECT mobile_number FROM responsibles WHERE id = $1', [contact.id])).rows[0].mobile_number,
  ).toBe('789');
  expect((await (await request.delete(url)).json()).severity).toBe('success');
  expect((await database.query('SELECT id FROM responsibles WHERE id = $1', [contact.id])).rowCount).toBe(0);
});

// Exercise the actual XLSX parser, multipart upload handling, code mapping and SQL writes.
for (const kind of ['reporting', 'general-information', 'invoicing', 'responsibles']) {
  test(`spreadsheet import persists: ${kind}`, async ({ request, database }) => {
    const workbook = utils.book_new();
    const sheets = [
      [
        ['code', 'date', 'butts', 'motivation'],
        ['9901', '04/05/24', '456.78', 'Smoke imported'],
      ],
      [
        ['code', 'inhabitants', 'surface', 'cost', 'kg', 'epa'],
        ['9901', '13579', '260.25', '100000', '200', 'Yes'],
      ],
      [
        ['code', 'invoice date', 'paid', 'amount', 'vat'],
        ['9901', '2024-05-06', '2024-06-07', '17000', '4250'],
      ],
      [
        ['code', 'name', 'email', 'phone', 'title'],
        ['9901', 'Smoke imported contact', 'imported@example.invalid', '12345', 'Tester'],
      ],
    ];
    sheets.forEach((rows, index) => utils.book_append_sheet(workbook, utils.aoa_to_sheet(rows), `Sheet${index}`));
    const response = await request.post(dataUrl(`/api/${kind}/import`, `api/${kind}/import.ts`), {
      multipart: {
        year: String(year),
        file: {
          name: 'smoke.xlsx',
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          buffer: write(workbook, { type: 'buffer', bookType: 'xlsx' }),
        },
      },
    });
    expect(response.status(), await response.text()).toBe(200);
    expect((await response.json()).severity).toBe('success');
    const checks: Record<string, [string, string]> = {
      reporting: [
        `SELECT cigarette_butts::text AS value FROM reporting WHERE company_id = $1 AND year = ${year}`,
        '456.78',
      ],
      'general-information': [
        `SELECT inhabitants::text AS value FROM general_information WHERE company_id = $1 AND year = ${year}`,
        '13579',
      ],
      invoicing: [
        `SELECT invoice_amount::text AS value FROM invoicing WHERE company_id = $1 AND year = ${year}`,
        '17000.00',
      ],
      responsibles: [
        "SELECT name AS value FROM responsibles WHERE company_id = $1 AND email = 'imported@example.invalid'",
        'Smoke imported contact',
      ],
    };
    const [sql, value] = checks[kind];
    expect((await database.query(sql, [companyId])).rows[0].value).toBe(value);
  });
}

test('reminder action links a real reminder to its log', async ({ request, database }) => {
  const response = await request.post(
    dataUrl(`/api/municipalities/${companyId}/reminders`, 'api/municipalities/reminders.ts'),
    {
      form: { description: 'Smoke persisted reminder', date: `${year}-12-15`, logId },
    },
  );
  expect((await response.json()).severity).toBe('success');
  expect(
    (
      await database.query(
        'SELECT r.description FROM logs l JOIN reminders r ON l.reminder_id = r.id WHERE l.id = $1',
        [logId],
      )
    ).rows[0].description,
  ).toBe('Smoke persisted reminder');
});

test('municipality update and delete persist', async ({ request, database }) => {
  const {
    rows: [company],
  } = await database.query(
    "INSERT INTO companies (name, code, email, status_id) VALUES ('Smoke disposable', '9999', 'disposable@example.invalid', 1) RETURNING id",
  );
  const url = dataUrl(`/api/municipalities/${company.id}`, 'api/municipalities/route.ts');
  expect((await (await request.patch(url, { form: { name: 'Smoke disposable updated' } })).json()).severity).toBe(
    'success',
  );
  expect((await database.query('SELECT name FROM companies WHERE id = $1', [company.id])).rows[0].name).toBe(
    'Smoke disposable updated',
  );
  expect((await (await request.delete(url)).json()).severity).toBe('success');
  expect((await database.query('SELECT id FROM companies WHERE id = $1', [company.id])).rowCount).toBe(0);
});

test('status create and delete persist', async ({ request, database }) => {
  const url = dataUrl('/statuses', 'views/statuses/route.tsx');
  expect((await (await request.post(url, { form: { statusName: 'Smoke disposable status' } })).json()).severity).toBe(
    'success',
  );
  const {
    rows: [status],
  } = await database.query('SELECT id FROM statuses WHERE name = $1', ['Smoke disposable status']);
  expect((await (await request.delete(url, { form: { id: String(status.id) } })).json()).severity).toBe('success');
  expect((await database.query('SELECT id FROM statuses WHERE id = $1', [status.id])).rowCount).toBe(0);
});
