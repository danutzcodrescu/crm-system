import { json, LoaderFunctionArgs, redirect } from '@remix-run/node';
import { Outlet } from '@remix-run/react';
import { auth } from '~/utils/server/auth.server';
import { getEmailsPerMunicipality, gmail } from '~/utils/server/services/gmail.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const isLoggedIn = await auth.isLoggedIn(request);
  if (!isLoggedIn) return redirect('/signin');
  if (!gmail.isTokenSet()) {
    await gmail.getRedirectUrlIfThereIsNoToken(request);
  }
  const searchParams = new URL(request.url).searchParams;
  if (!searchParams.has('municipalityId')) {
    return json({ message: 'Municipality ID is required', severity: 'error' }, { status: 400 });
  }
  const companyId = searchParams.get('municipalityId') as string;
  const [error, data] = await getEmailsPerMunicipality(companyId);
  if (error) {
    return json({ message: 'Could not fetch emails', severity: 'error' }, { status: 500 });
  }
  return json({ message: data, severity: 'success' }, { status: 200 });
}

export default function EmailApiRoute() {
  return <Outlet />;
}
