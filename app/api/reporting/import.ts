import { type ActionFunctionArgs, data as routeData, redirect } from 'react-router';
import { utils } from 'xlsx';

import { isLoggedIn } from '~/utils/server/auth.server';
import { getCompaniesWithCode } from '~/utils/server/repositories/companies.server';
import { bulkImportReporting } from '~/utils/server/repositories/reporting.server';
import { parseSpreadsheetUpload } from '~/utils/server/spreadsheet-upload.server';

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
  const isAuthenticated = await isLoggedIn(request);
  if (!isAuthenticated) return redirect('/signin');
  const { formData, workbook } = await parseSpreadsheetUpload(request);
  const year = formData.get('year') as string;
  if (!year || !workbook || !workbook.Sheets[workbook.SheetNames[0]]) {
    return routeData({ message: 'Invalid file', severity: 'error', timeStamp: Date.now() }, { status: 400 });
  }
  const dt = utils
    .sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {
      header: ['code', 'reportingDate', 'cigaretteButts', 'motivation'],
      raw: false,
      dateNF: 'dd/mm/yyyy',
      defval: undefined,
    })
    .slice(1) as ReportingData[];
  const [error, data] = await getCompaniesWithCode();
  if (error) {
    return routeData(
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
    return routeData(
      { message: 'Could not import the reporting', severity: 'error', timeStamp: Date.now() },
      { status: 500 },
    );
  }

  return routeData({ message: 'Reporting data imported successfully', severity: 'success', timeStamp: Date.now() });
}
