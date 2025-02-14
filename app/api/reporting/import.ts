import {
  type ActionFunctionArgs,
  json,
  unstable_composeUploadHandlers,
  unstable_createMemoryUploadHandler,
  unstable_parseMultipartFormData,
} from '@remix-run/node';
import { read, utils } from 'xlsx';

import { logger } from '~/utils/server/logger.server';
import { getCompaniesWithCode } from '~/utils/server/repositories/companies.server';
import { bulkImportReporting } from '~/utils/server/repositories/reporting.server';

interface ReportingData {
  code: string;
  reportingDate?: string;
  cigaretteButts?: string;
  motivation?: string;
}

function formatDate(date: string) {
  if (!date) {
    return undefined;
  }
  const [month, day, year] = date.split('/');
  // @ts-expect-error it works
  return new Date(`20${year}`, month - 1, day);
}

export async function action({ request }: ActionFunctionArgs) {
  let dt: ReportingData[] = [];
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
          .sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {
            header: ['code', 'reportingDate', 'cigaretteButts', 'motivation'],
            raw: false,
            dateNF: 'dd/mm/yyyy',
            defval: undefined,
          })
          .slice(1) as ReportingData[];
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
  console.log(year);
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

  const err = await bulkImportReporting(
    dt.map((report) => ({
      companyId: codeMap.get(report.code) as string,
      year: parseInt(year),
      reportingDate: report.reportingDate ? formatDate(report.reportingDate) : undefined,
      cigaretteButts: report.cigaretteButts ? parseFloat(report.cigaretteButts) : undefined,
      motivation: report.motivation,
    })),
  );

  if (err) {
    return json(
      { message: 'Could not import the reporting', severity: 'error', timeStamp: Date.now() },
      { status: 500 },
    );
  }
  console.log('test');

  return json({ message: 'Reporting data imported successfully', severity: 'success', timeStamp: Date.now() });
}
