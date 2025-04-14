import { sql } from 'drizzle-orm';
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
    header: ['code', 'name', 'manualConsultation', 'declinedAgreement', 'workingCategory', 'wave'],
    raw: false,
    defval: undefined,
  }) as [
    {
      code: string;
      name: string;
      manualConsultation: string;
      declinedAgreement: string;
      workingCategory: string;
      wave: string;
    },
  ];

  return rows;
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

  await db.execute(sql`UPDATE ${companies} AS c
SET
    name = d.name,
    manual_consultation = d.manual_consultation,
    declined_agreement = d.declined_agreement,
    working_category = d.category,
    wave = d.wave
FROM jsonb_to_recordset(${JSON.stringify(
    communes.map((commune) => ({
      name: commune.name,
      id: companiesMap[commune.code],
      manual_consultation: commune.manualConsultation === 'Yes' ? true : null,
      declined_agreement: commune.declinedAgreement === 'Yes' ? true : null,
      category: `wave ${commune.workingCategory}`,
      wave: commune.wave,
    })),
  )}::jsonb) AS d(id UUID, name TEXT, manual_consultation BOOLEAN, declined_agreement BOOLEAN, category working_category, wave TEXT)
WHERE c.id = d.id;`);

  process.exit(0);
}

main();
