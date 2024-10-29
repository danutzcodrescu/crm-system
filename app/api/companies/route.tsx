import { json, LoaderFunctionArgs, redirect } from '@remix-run/node';

import { auth } from '~/utils/server/auth.server';
import { getCompanies } from '~/utils/server/repositories/companies.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const isLoggedIn = await auth.isLoggedIn(request);
  if (!isLoggedIn) return redirect('/signin');

  const [error, data] = await getCompanies();
  if (error) {
    return json({ message: 'There was an error retrieving the companies.', severity: 'error' }, { status: 500 });
  }

  return json({ message: data, severity: 'success' });
}
