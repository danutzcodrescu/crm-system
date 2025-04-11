import { eq } from 'drizzle-orm';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import xlsx from 'xlsx';

import { db } from '~/utils/server/repositories/db.server';
import { companies } from '~/utils/server/schema.server';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function readCommunes() {
  const workbook = xlsx.readFile(path.resolve(__dirname, './20241205_Master CRM data.xlsx'));
  const rows = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {
    header: ['code', 'name'],
  }) as [
    {
      name: string;
      code: string;
    },
  ];

  return rows;
}

async function main() {
  const communes = readCommunes();

  communes.forEach(async (commune) => {
    await db.update(companies).set({ name: commune.name }).where(eq(companies.code, commune.code));
  });
}

main();
