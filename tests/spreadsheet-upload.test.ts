import assert from 'node:assert/strict';
import test from 'node:test';

import { MaxFilesExceededError, MaxPartsExceededError } from '@remix-run/form-data-parser';
import { utils, write } from 'xlsx';

import { parseSpreadsheetUpload } from '../app/utils/server/spreadsheet-upload.server';

function request(formData: FormData) {
  return new Request('http://smoke.invalid/api/reporting/import', { method: 'POST', body: formData });
}

test('spreadsheet uploads retain form fields and parse the real XLSX workbook', async () => {
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, utils.aoa_to_sheet([['code'], ['9901']]), 'Reporting');
  const body = new FormData();
  body.set('year', '2026');
  body.set('file', new Blob([write(workbook, { type: 'array', bookType: 'xlsx' })]), 'report.xlsx');

  const result = await parseSpreadsheetUpload(request(body));
  assert.equal(result.formData.get('year'), '2026');
  assert.equal(result.formData.get('file'), 'parsed');
  assert.ok(result.workbook);
  assert.deepEqual(utils.sheet_to_json(result.workbook.Sheets.Reporting), [{ code: '9901' }]);
});

test('a missing file does not become a parsed workbook', async () => {
  const body = new FormData();
  body.set('year', '2026');
  body.set('unrelated', 'no file');
  const result = await parseSpreadsheetUpload(request(body));
  assert.equal(result.workbook, undefined);
});

test('uploads reject additional files instead of buffering an unbounded batch', async () => {
  const body = new FormData();
  body.append('unrelated', new Blob(['first']), 'first.txt');
  body.append('unrelated', new Blob(['second']), 'second.txt');
  await assert.rejects(parseSpreadsheetUpload(request(body)), MaxFilesExceededError);
});

test('uploads enforce the total multipart part count', async () => {
  const body = new FormData();
  for (let index = 0; index < 11; index++) body.append(`field-${index}`, 'value');
  await assert.rejects(parseSpreadsheetUpload(request(body)), MaxPartsExceededError);
});
