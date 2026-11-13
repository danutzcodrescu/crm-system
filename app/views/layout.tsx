import { Box } from '@mui/material';
import {
  ActionFunctionArgs,
  data as routeData,
  LoaderFunctionArgs,
  MetaFunction,
  Outlet,
  redirect,
  ShouldRevalidateFunctionArgs,
  useLoaderData,
} from 'react-router';

import { Topbar } from '~/components/Topbar';
import { isLoggedIn, logout } from '~/utils/server/auth.server';
import { clearRefreshToken, getRedirectUrlIfThereIsNoToken, isTokenSet } from '~/utils/server/services/gmail.server';

export async function loader({ request, url }: LoaderFunctionArgs) {
  const isAuthenticated = await isLoggedIn(request);
  if (!isAuthenticated) return redirect('/signin');
  if (!isTokenSet) {
    const token = await getRedirectUrlIfThereIsNoToken(request, url);
    return routeData({ redirectUrl: token });
  }
  setImmediate(() => clearRefreshToken());
  return routeData({ redirectUrl: undefined });
}

export async function action({ request }: ActionFunctionArgs) {
  const isAuthenticated = await isLoggedIn(request);
  if (!isAuthenticated) return redirect('/signin');
  await logout(request);
  return redirect('/signin');
}

export const meta: MetaFunction = () => {
  return [{ title: 'CRM System - Years' }];
};

export function shouldRevalidate({ formAction, formMethod }: ShouldRevalidateFunctionArgs) {
  if (
    formAction === '/api/responsibles' ||
    (formMethod === 'GET' && formAction === '/api/municipalities') ||
    formAction?.includes('attachments')
  )
    return false;
  return true;
}

export default function AppLayout() {
  const data = useLoaderData<typeof loader>();
  return (
    <>
      <Topbar redirectUrl={data.redirectUrl} />

      <Box sx={{ backgroundColor: (theme) => theme.palette.primary.dark }}>
        <Outlet />
      </Box>
    </>
  );
}
