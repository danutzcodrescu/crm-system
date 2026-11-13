import { parseFormData } from '@remix-run/form-data-parser';
import { read, type WorkBook } from 'xlsx';

import { logger } from './logger.server';

// Preserve the existing import size allowance while also bounding file count,
// field count and total request size (the old custom upload handler was unbounded).
export const MAX_SPREADSHEET_SIZE = 500_000_000;

export async function parseSpreadsheetUpload(request: Request) {
  let workbook: WorkBook | undefined;
  const formData = await parseFormData(
    request,
    {
      maxFileSize: MAX_SPREADSHEET_SIZE,
      maxFiles: 1,
      maxParts: 10,
      maxTotalSize: MAX_SPREADSHEET_SIZE + 100_000,
    },
    async (file) => {
      if (file.fieldName !== 'file') return;
      try {
        workbook = read(new Uint8Array(await file.arrayBuffer()), { type: 'array' });
        return 'parsed';
      } catch (error) {
        logger.error(error);
        return 'error';
      }
    },
  );

  return { formData, workbook };
}
