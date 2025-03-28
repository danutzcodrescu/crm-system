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
import { bulkImportGeneralInformation } from '~/utils/server/repositories/generalInformation.server';

interface GeneralInformationData {
  code: string;
  inhabitants?: string;
  landSurface?: string;
  cleaningCost?: string;
  cleanedKg?: string;
  epaLitterMeasurement?: string;
}

export async function action({ request }: ActionFunctionArgs) {
  const isLoggedIn = await auth.isLoggedIn(request);
  if (!isLoggedIn) return redirect('/signin');
  let dt: GeneralInformationData[] = [];
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
          .sheet_to_json(workbook.Sheets[workbook.SheetNames[1]], {
            header: ['code', 'inhabitants', 'landSurface', 'cleaningCost', 'cleanedKg', 'epaLitterMeasurement'],
            raw: false,
            defval: undefined,
          })
          .slice(1) as GeneralInformationData[];
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
    return json(
      { message: 'Could not import the general information', severity: 'error', timeStamp: Date.now() },
      { status: 500 },
    );
  }

  return json({
    message: 'General information data imported successfully',
    severity: 'success',
    timeStamp: Date.now(),
  });
}
