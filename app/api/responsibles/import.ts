import {
  type ActionFunctionArgs,
  json,
  redirect,
  unstable_composeUploadHandlers,
  unstable_createMemoryUploadHandler,
  unstable_parseMultipartFormData,
} from '@remix-run/node';
import { read, utils } from 'xlsx';

import { isLoggedIn } from '~/utils/server/auth.server';
import { logger } from '~/utils/server/logger.server';
import { getCompaniesWithCode } from '~/utils/server/repositories/companies.server';
import { bulkImportResponsibles } from '~/utils/server/repositories/responsibles.server';
import { responsibles } from '~/utils/server/schema.server';

interface ContactData {
  code: string;
  contactName?: string;
  contactEmail: string;
  contactPhone?: string;
  contactPosition?: string;
}

export async function action({ request }: ActionFunctionArgs) {
  const isAuthenticated = await isLoggedIn(request);
  if (!isAuthenticated) return redirect('/signin');
  let dt: ContactData[] = [];
  const uploadHandler = unstable_composeUploadHandlers(
    async ({ name, data }) => {
      if (name !== 'file') {
        return undefined;
      }
      const chunks = [] as Uint8Array[];
      for await (const x of data) {
        chunks.push(x);
      }
      try {
        const workbook = read(Buffer.concat(chunks), { type: 'buffer' });
        dt = utils
          .sheet_to_json(workbook.Sheets[workbook.SheetNames[3]], {
            header: ['code', 'contactName', 'contactEmail', 'contactPhone', 'contactPosition'],
            raw: false,
            defval: undefined,
          })
          .slice(1) as ContactData[];
        return 'parsed';
      } catch (e) {
        logger.error(e);
        return 'error';
      }
    },
    unstable_createMemoryUploadHandler({
      maxPartSize: 500_000_000,
    }),
  );

  const formData = await unstable_parseMultipartFormData(request, uploadHandler);
  const year = formData.get('year') as string;

  if (!year || formData.get('file') !== 'parsed') {
    return json({ message: 'Invalid file', severity: 'error', timeStamp: Date.now() }, { status: 400 });
  }
  const [error, data] = await getCompaniesWithCode();
  if (error) {
    return json(
      { message: 'Could not get the municipalities', severity: 'error', timeStamp: Date.now() },
      { status: 500 },
    );
  }
  const codeMap = new Map(data?.map((comp) => [comp.code, comp.id]));

  const err = await bulkImportResponsibles(
    dt.reduce(
      (acc, val) => {
        if (acc[codeMap.get(val.code) as string]) {
          acc[codeMap.get(val.code) as string].push({
            companyId: codeMap.get(val.code) as string,
            name: val.contactName as string,
            email: val.contactEmail as string,
            title: val.contactPosition as string,
            phoneNumber: val.contactPhone as string,
          });
        } else {
          acc[codeMap.get(val.code) as string] = [
            {
              companyId: codeMap.get(val.code) as string,
              name: val.contactName as string,
              email: val.contactEmail as string,
              title: val.contactPosition as string,
              phoneNumber: val.contactPhone as string,
            },
          ];
        }

        return acc;
      },
      {} as Record<string, (typeof responsibles.$inferInsert)[]>,
    ),
  );

  if (err) {
    return json(
      { message: 'Could not import the contact data', severity: 'error', timeStamp: Date.now() },
      { status: 500 },
    );
  }

  return json({
    message: 'Contact data imported successfully',
    severity: 'success',
    timeStamp: Date.now(),
  });
}
