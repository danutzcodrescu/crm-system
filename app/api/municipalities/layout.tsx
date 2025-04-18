import { json, LoaderFunctionArgs, redirect } from '@remix-run/node';
import { Outlet } from '@remix-run/react';

import { isLoggedIn } from '~/utils/server/auth.server';
import { getCompanies } from '~/utils/server/repositories/companies.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const isAuthenticated = await isLoggedIn(request);
  if (!isAuthenticated) return redirect('/signin');
  const [error, data] = await getCompanies();
  if (error) {
    return json(
      { message: 'Could not retrieve commune data', severity: 'error', timeStamp: Date.now() },
      { status: 500 },
    );
  }
  return json({ message: data, severity: 'success', timeStamp: Date.now() });
}

export default function MunicipalitiesApiLayout() {
  return <Outlet />;
}
