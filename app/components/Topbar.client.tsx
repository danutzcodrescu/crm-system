import ExitToApp from '@mui/icons-material/ExitToApp';
import { AppBar, IconButton, Toolbar, Typography } from '@mui/material';
import { Form } from '@remix-run/react';

export function Topbar() {
  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <Typography variant="h6" noWrap component="h1" sx={{ flex: 1 }}>
          Crm System
        </Typography>
        <Form method="POST">
          <IconButton size="small" type="submit" aria-label="signout">
            <ExitToApp />
          </IconButton>
        </Form>
      </Toolbar>
    </AppBar>
  );
}
