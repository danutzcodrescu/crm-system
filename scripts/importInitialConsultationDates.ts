import { sql } from 'drizzle-orm';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import xlsx from 'xlsx';

import { db } from '~/utils/server/repositories/db.server';
import { companies, initialConsultation } from '~/utils/server/schema.server';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function readCommunes() {
  const workbook = xlsx.readFile(path.resolve(__dirname, './20241205_Master CRM data.xlsx'));
  const rows = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {
    header: ['code', 'name', 'date'],
    raw: false,
    dateNF: 'dd/mm/yyyy',
    defval: undefined,
  }) as [
    {
      code: string;
      name: string;
      date: string;
    },
  ];

  return rows;
}

function formatDate(date: string) {
  if (!date) {
    return undefined;
  }
  const [day, month, year] = date.split('/');
  return `${year}-${month}-${day} 00:00:00+00`;
}

async function main() {
  const communes = readCommunes();
  const companiesList = await db
    .select({ id: companies.id, code: companies.code, name: companies.name })
    .from(companies);
  const companiesMap = companiesList.reduce(
    (acc, company) => {
      acc[company.code] = company.id;
      return acc;
    },
    {} as { [key: string]: string },
  );

  await db.execute(sql`UPDATE ${initialConsultation} AS c
  SET
      document_date_sent = d.date
  FROM jsonb_to_recordset(${JSON.stringify(
    communes.map((commune) => ({
      id: companiesMap[commune.code],
      date: commune.date ? formatDate(commune.date) : null,
    })),
  )}::jsonb) AS d(id UUID, date TIMESTAMPTZ)
  WHERE c.company_id = d.id;`);

  process.exit(0);
}

main();
