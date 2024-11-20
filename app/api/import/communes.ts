import { type ActionFunctionArgs, json, unstable_parseMultipartFormData } from '@remix-run/node';
import { read, utils } from 'xlsx';

import { db } from '~/utils/server/repositories/db.server';
import { companies } from '~/utils/server/schema.server';

export async function action({ request }: ActionFunctionArgs) {
  await unstable_parseMultipartFormData(request, async ({ name, data }) => {
    if (name !== 'communes') {
      return undefined;
    }
    const chunks = [] as Uint8Array[];

    for await (const x of data) {
      chunks.push(x);
    }

    const workbook = read(Buffer.concat(chunks), { type: 'buffer' });
    const rows = utils
      .sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: ['name', 'code'] })
      .slice(1) as [{ name: string; code: string }];
    try {
      await db.insert(companies).values(rows);
    } catch (error) {
      console.log(error);
      return json({ message: 'Could not import communes', severity: 'error', timeStamp: Date.now() }, { status: 500 });
    }
  });
  return json({ message: 'Communes imported successfully', severity: 'success', timeStamp: Date.now() });
}
