import { ActionFunctionArgs, json, redirect } from '@remix-run/node';

import { auth } from '~/utils/server/auth.server';
import { deleteCompany } from '~/utils/server/repositories/companies.server';

export async function action({ request, params }: ActionFunctionArgs) {
  const isLoggedIn = await auth.isLoggedIn(request);
  if (!isLoggedIn) return redirect('/signin');

  if (request.method === 'DELETE') {
    const id = params.companyId;

    const error = await deleteCompany(id as string);

    if (error) {
      return json({ message: 'Could not delete commune', severity: 'error', timeStamp: Date.now() }, { status: 500 });
    }
    return json({ message: 'Commune deleted successfully', severity: 'success', timeStamp: Date.now() });
  }
}
