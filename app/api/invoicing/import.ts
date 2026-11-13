import { type ActionFunctionArgs, data as routeData, redirect } from 'react-router';
import { utils } from 'xlsx';

import { isLoggedIn } from '~/utils/server/auth.server';
import { getCompaniesWithCode } from '~/utils/server/repositories/companies.server';
import { bulkImportInvoicing } from '~/utils/server/repositories/invoicing.server';
import { parseSpreadsheetUpload } from '~/utils/server/spreadsheet-upload.server';

interface InvoicingData {
  code: string;
  invoiceDate?: string;
  datePaid?: string;
  invoiceAmount?: string;
  vat?: string;
}

export async function action({ request }: ActionFunctionArgs) {
  const isAuthenticated = await isLoggedIn(request);
  if (!isAuthenticated) return redirect('/signin');
  const { formData, workbook } = await parseSpreadsheetUpload(request);
  const year = formData.get('year') as string;

  if (!year || !workbook || !workbook.Sheets[workbook.SheetNames[2]]) {
    return routeData({ message: 'Invalid file', severity: 'error', timeStamp: Date.now() }, { status: 400 });
  }
  const dt = utils
    .sheet_to_json(workbook.Sheets[workbook.SheetNames[2]], {
      header: ['code', 'invoiceDate', 'datePaid', 'invoiceAmount', 'vat'],
      raw: false,
      defval: undefined,
    })
    .slice(1) as InvoicingData[];
  const [error, data] = await getCompaniesWithCode();
  if (error) {
    return routeData(
      { message: 'Could not get the municipalities', severity: 'error', timeStamp: Date.now() },
      { status: 500 },
    );
  }
  const codeMap = new Map(data?.map((comp) => [comp.code, comp.id]));

  const err = await bulkImportInvoicing(
    dt.map((info) => ({
      companyId: codeMap.get(info.code) as string,
      year: parseInt(year),
      invoiceAmount: info.invoiceAmount ? parseInt(info.invoiceAmount.replace(',', '')) : undefined,
      vat: info.vat ? parseInt(info.vat.replaceAll(',', '')) : undefined,
      datePaid: info.datePaid ? new Date(info.datePaid) : undefined,
      invoiceDate: info.invoiceDate ? new Date(info.invoiceDate) : undefined,
    })),
  );

  if (err) {
    return routeData(
      { message: 'Could not import the invoicing data', severity: 'error', timeStamp: Date.now() },
      { status: 500 },
    );
  }

  return routeData({
    message: 'Invoicing data imported successfully',
    severity: 'success',
    timeStamp: Date.now(),
  });
}
