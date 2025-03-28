import {
  type ActionFunctionArgs,
  json,
  redirect,
  unstable_composeUploadHandlers,
  unstable_createMemoryUploadHandler,
  unstable_parseMultipartFormData,
} from '@remix-run/node';
import { read, utils } from 'xlsx';

import { auth } from '~/utils/server/auth.server';
import { logger } from '~/utils/server/logger.server';
import { getCompaniesWithCode } from '~/utils/server/repositories/companies.server';
import { bulkImportInvoicing } from '~/utils/server/repositories/invoicing.server';

interface InvoicingData {
  code: string;
  invoiceDate?: string;
  datePaid?: string;
  invoiceAmount?: string;
  vat?: string;
}

export async function action({ request }: ActionFunctionArgs) {
  const isLoggedIn = await auth.isLoggedIn(request);
  if (!isLoggedIn) return redirect('/signin');
  let dt: InvoicingData[] = [];
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
          .sheet_to_json(workbook.Sheets[workbook.SheetNames[2]], {
            header: ['code', 'invoiceDate', 'datePaid', 'invoiceAmount', 'vat'],
            raw: false,
            defval: undefined,
          })
          .slice(1) as InvoicingData[];
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
    return json(
      { message: 'Could not import the invoicing data', severity: 'error', timeStamp: Date.now() },
      { status: 500 },
    );
  }

  return json({
    message: 'Invoicing data imported successfully',
    severity: 'success',
    timeStamp: Date.now(),
  });
}
