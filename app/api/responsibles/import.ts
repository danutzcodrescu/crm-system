import { type ActionFunctionArgs, data as routeData, redirect } from 'react-router';
import { utils } from 'xlsx';

import { isLoggedIn } from '~/utils/server/auth.server';
import { getCompaniesWithCode } from '~/utils/server/repositories/companies.server';
import { bulkImportResponsibles } from '~/utils/server/repositories/responsibles.server';
import { responsibles } from '~/utils/server/schema.server';
import { parseSpreadsheetUpload } from '~/utils/server/spreadsheet-upload.server';

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
  const { formData, workbook } = await parseSpreadsheetUpload(request);
  const year = formData.get('year') as string;

  if (!year || !workbook || !workbook.Sheets[workbook.SheetNames[3]]) {
    return routeData({ message: 'Invalid file', severity: 'error', timeStamp: Date.now() }, { status: 400 });
  }
  const dt = utils
    .sheet_to_json(workbook.Sheets[workbook.SheetNames[3]], {
      header: ['code', 'contactName', 'contactEmail', 'contactPhone', 'contactPosition'],
      raw: false,
      defval: undefined,
    })
    .slice(1) as ContactData[];
  const [error, data] = await getCompaniesWithCode();
  if (error) {
    return routeData(
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
    return routeData(
      { message: 'Could not import the contact data', severity: 'error', timeStamp: Date.now() },
      { status: 500 },
    );
  }

  return routeData({
    message: 'Contact data imported successfully',
    severity: 'success',
    timeStamp: Date.now(),
  });
}
