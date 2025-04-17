import { json, LoaderFunctionArgs, redirect } from '@remix-run/node';
import { Outlet } from '@remix-run/react';

import { isLoggedIn } from '~/utils/server/auth.server';
import {
  getEmailsPerMunicipality,
  getRedirectUrlIfThereIsNoToken,
  isTokenSet,
  Thread,
} from '~/utils/server/services/gmail.server';

export interface EmailApiResponse {
  message: {
    emails: Thread[];
    municipalityId: string;
  };
  severity: 'success';
}

export async function loader({ request }: LoaderFunctionArgs) {
  const isAuthenticated = await isLoggedIn(request);
  if (!isAuthenticated) return redirect('/signin');
  if (!isTokenSet()) {
    await getRedirectUrlIfThereIsNoToken(request);
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
  return json({ message: { emails: data, municipalityId: companyId }, severity: 'success' }, { status: 200 });
}

export default function EmailApiRoute() {
  return <Outlet />;
}
