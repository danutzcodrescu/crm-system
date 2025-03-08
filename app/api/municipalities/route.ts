import { ActionFunctionArgs, json, redirect } from '@remix-run/node';

import { auth } from '~/utils/server/auth.server';
import { deleteCompany } from '~/utils/server/repositories/companies.server';
import { updateMunicipality } from '~/utils/server/repositories/municipalities.server';

export async function action({ request, params }: ActionFunctionArgs) {
  const isLoggedIn = await auth.isLoggedIn(request);
  if (!isLoggedIn) return redirect('/signin');
  const id = params.companyId;

  if (request.method === 'PATCH') {
    const data = await request.formData();
    if (!id) {
      return json(
        { message: 'Missing required parameters', severity: 'error', timeStamp: Date.now() },
        { status: 400 },
      );
    }

    const [error] = await updateMunicipality({
      statusId: parseInt(data.get('statusId') as string),
      companyId: id as string,
      email: data.get('email') as string,
      code: data.get('code') as string,
      name: data.get('name') as string,
      // @ts-expect-error it is the only way to set the user to null if selected
      responsibleId:
        data.get('responsibleId') && data.get('responsibleId') !== '0'
          ? parseInt(data.get('responsibleId') as string)
          : null,
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
