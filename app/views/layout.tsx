import { Box, Drawer, List, ListItem, ListItemButton, ListItemText, Stack, Toolbar } from '@mui/material';
import { ActionFunctionArgs, json, LoaderFunctionArgs, redirect } from '@remix-run/node';
import { Link, Outlet } from '@remix-run/react';
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

export default function AppLayout() {
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
                <ListItem key={text} disablePadding>
                  <ListItemButton component={Link} to={`/${text.toLocaleLowerCase()}`}>
                    {/* <ListItemIcon>{index % 2 === 0 ? <InboxIcon /> : <MailIcon />}</ListItemIcon> */}
                    <ListItemText primary={text} />
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
