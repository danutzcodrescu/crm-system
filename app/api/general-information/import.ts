import { type ActionFunctionArgs, data as routeData, redirect } from 'react-router';
import { utils } from 'xlsx';

import { isLoggedIn } from '~/utils/server/auth.server';
import { getCompaniesWithCode } from '~/utils/server/repositories/companies.server';
import { bulkImportGeneralInformation } from '~/utils/server/repositories/generalInformation.server';
import { parseSpreadsheetUpload } from '~/utils/server/spreadsheet-upload.server';

interface GeneralInformationData {
  code: string;
  inhabitants?: string;
  landSurface?: string;
  cleaningCost?: string;
  cleanedKg?: string;
  epaLitterMeasurement?: string;
}

export async function action({ request }: ActionFunctionArgs) {
  const isAuthenticated = await isLoggedIn(request);
  if (!isAuthenticated) return redirect('/signin');
  const { formData, workbook } = await parseSpreadsheetUpload(request);
  const year = formData.get('year') as string;

  if (!year || !workbook || !workbook.Sheets[workbook.SheetNames[1]]) {
    return routeData({ message: 'Invalid file', severity: 'error', timeStamp: Date.now() }, { status: 400 });
  }
  const dt = utils
    .sheet_to_json(workbook.Sheets[workbook.SheetNames[1]], {
      header: ['code', 'inhabitants', 'landSurface', 'cleaningCost', 'cleanedKg', 'epaLitterMeasurement'],
      raw: false,
      defval: undefined,
    })
    .slice(1) as GeneralInformationData[];

  const [error, data] = await getCompaniesWithCode();
  if (error) {
    return routeData(
      { message: 'Could not get the municipalities', severity: 'error', timeStamp: Date.now() },
      { status: 500 },
    );
  }

  const codeMap = new Map(data?.map((comp) => [comp.code, comp.id]));

  const err = await bulkImportGeneralInformation(
    dt.map((info) => ({
      companyId: codeMap.get(info.code) as string,
      year: parseInt(year),
      inhabitants: info.inhabitants ? parseInt((info.inhabitants as string).replaceAll(',', '')) : undefined,
      landSurface: info.landSurface ? parseFloat(info.landSurface as string) : undefined,
      cleaningCost: info.cleaningCost ? parseInt((info.cleaningCost as string).replaceAll(',', '')) : undefined,
      cleanedKg: info.cleanedKg ? parseInt((info.cleanedKg as string).replaceAll(',', '')) : undefined,
      epaLitterMeasurement: info.epaLitterMeasurement?.toLocaleLowerCase() === 'yes' ? true : undefined,
    })),
  );

  if (err) {
    return routeData(
      { message: 'Could not import the general information', severity: 'error', timeStamp: Date.now() },
      { status: 500 },
    );
  }

  return routeData({
    message: 'General information data imported successfully',
    severity: 'success',
    timeStamp: Date.now(),
  });
}
