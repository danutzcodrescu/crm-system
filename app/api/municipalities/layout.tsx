import { data as routeData, LoaderFunctionArgs, Outlet, redirect } from 'react-router';

import { isLoggedIn } from '~/utils/server/auth.server';
import { getCompanies } from '~/utils/server/repositories/companies.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const isAuthenticated = await isLoggedIn(request);
  if (!isAuthenticated) return redirect('/signin');
  const [error, data] = await getCompanies();
  if (error) {
    return routeData(
      { message: 'Could not retrieve commune data', severity: 'error', timeStamp: Date.now() },
      { status: 500 },
    );
  }
  return routeData({ message: data, severity: 'success', timeStamp: Date.now() });
}

export default function MunicipalitiesApiLayout() {
  return <Outlet />;
}
