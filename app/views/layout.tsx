import { Box } from '@mui/material';
import { ActionFunctionArgs, json, LoaderFunctionArgs, MetaFunction, redirect } from '@remix-run/node';
import { Outlet, ShouldRevalidateFunctionArgs, useLoaderData } from '@remix-run/react';

import { Topbar } from '~/components/Topbar';
import { auth } from '~/utils/server/auth.server';
import { gmail } from '~/utils/server/services/gmail.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const isLoggedIn = await auth.isLoggedIn(request);
  if (!isLoggedIn) return redirect('/signin');
  const isTokenSet = gmail.isTokenSet();

  if (!isTokenSet) {
    const token = await gmail.getRedirectUrlIfThereIsNoToken(request);
    return json({ redirectUrl: token });
  }
  setImmediate(() => gmail.clearRefreshToken());
  return json({ redirectUrl: undefined });
}

export async function action({ request }: ActionFunctionArgs) {
  const isLoggedIn = await auth.isLoggedIn(request);
  if (!isLoggedIn) return redirect('/signin');
  await auth.logout(request);
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
