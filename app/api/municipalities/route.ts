import { ActionFunctionArgs, json, redirect } from '@remix-run/node';
import { omit } from 'lodash-es';

import { isLoggedIn } from '~/utils/server/auth.server';
import { deleteCompany } from '~/utils/server/repositories/companies.server';
import { updateMunicipality } from '~/utils/server/repositories/municipalities.server';

export async function action({ request, params }: ActionFunctionArgs) {
  const isAuthenticated = await isLoggedIn(request);
  if (!isAuthenticated) return redirect('/signin');
  const id = params.companyId;

  if (request.method === 'PATCH') {
    const data = await request.formData();
    if (!id) {
      return json(
        { message: 'Missing required parameters', severity: 'error', timeStamp: Date.now() },
        { status: 400 },
      );
    }
    const obj = Array.from(data.entries()).reduce(
      (acc, [key, value]) => {
        if (key === 'manualConsultation' || key === 'declinedAgreement') {
          acc[key] = value === 'true' ? true : null;
        } else if (key === 'wave') {
          acc[key] = (value as string) || null;
        } else if (key === 'responsibleId') {
          acc[key] = value === '0' ? null : parseInt(value as string);
        } else if (key === 'infoVerified') {
          acc[key] = value ? new Date(value as string) : null;
        } else {
          acc[key] = value as string | number | boolean;
        }
        return acc;
      },
      {} as Record<string, string | number | boolean | null | Date>,
    );

    const [error] = await updateMunicipality({
      companyId: id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(omit(obj, ['id', 'companyId']) as any),
    });
    if (error) {
      return json({ message: 'Could not update commune', severity: 'error', timeStamp: Date.now() }, { status: 500 });
    }

    return json({ message: 'Municipality updated successfully', severity: 'success', timeStamp: Date.now() });
  }

  if (request.method === 'DELETE') {
    const error = await deleteCompany(id as string);

    if (error) {
      return json({ message: 'Could not delete commune', severity: 'error', timeStamp: Date.now() }, { status: 500 });
    }
    return json({ message: 'Commune deleted successfully', severity: 'success', timeStamp: Date.now() });
  }
}
