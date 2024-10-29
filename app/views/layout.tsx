import { Box, Drawer, List, ListItem, ListItemButton, ListItemText, Stack, Toolbar } from '@mui/material';
import { ActionFunctionArgs, json, LoaderFunctionArgs, MetaFunction, redirect } from '@remix-run/node';
import { Link, Outlet, useLocation } from '@remix-run/react';
import { ClientOnly } from 'remix-utils/client-only';

import { Topbar } from '~/components/Topbar.client';
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
  const location = useLocation();
  return (
    <>
      <ClientOnly>{() => <Topbar />}</ClientOnly>
      <Stack direction="row" gap={2}>
        <Drawer
          variant="permanent"
          sx={{
            width: '15rem',
            flexShrink: 0,
          }}
        >
          <Toolbar />
          <Box sx={{ overflow: 'auto' }}>
            <List>
              {['Companies', 'Contacts', 'Statuses', 'Years'].map((text) => (
                <ListItem key={text} disablePadding component={Link} to={`/${text.toLowerCase()}`} rel="prefetch">
                  <ListItemButton selected={location.pathname.startsWith(`/${text.toLowerCase()}`)}>
                    {/* <ListItemIcon>{index % 2 === 0 ? <InboxIcon /> : <MailIcon />}</ListItemIcon> */}
                    <ListItemText primary={text} sx={{ color: (theme) => theme.palette.common.black }} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        </Drawer>
        <Box sx={{ flex: 1, mt: '64px' }}>
          <Outlet />
        </Box>
      </Stack>
    </>
  );
}
