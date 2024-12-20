import { Box } from '@mui/material';
import { ActionFunctionArgs, json, LoaderFunctionArgs, MetaFunction, redirect } from '@remix-run/node';
import { Outlet } from '@remix-run/react';

import { Topbar } from '~/components/Topbar';
import { auth } from '~/utils/server/auth.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const isLoggedIn = await auth.isLoggedIn(request);
  if (!isLoggedIn) return redirect('/signin');
  return json({});
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

export default function AppLayout() {
  return (
    <>
      <Topbar />

      <Box sx={{ backgroundColor: (theme) => theme.palette.primary.dark }}>
        <Outlet />
      </Box>
    </>
  );
}
