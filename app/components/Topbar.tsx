import ExitToApp from '@mui/icons-material/ExitToApp';
import MenuIcon from '@mui/icons-material/Menu';
import WifiIcon from '@mui/icons-material/Wifi';
import { AppBar, Box, IconButton, Menu, MenuItem, Stack, Toolbar, Typography } from '@mui/material';
import { Form, Link as RLink } from '@remix-run/react';
import { getYear } from 'date-fns';
import { useCallback, useState } from 'react';

import { GlobalCreate } from './topbar/GlobalCreate';
import { SearchBox } from './topbar/SearchBox';

const links = [
  { title: 'Dashboard', href: '/' },
  { title: 'Process', href: '/process' },
  { title: 'Municipalities', href: '/municipalities' },
  { title: 'Initial Consultation', href: '/initial-consultation' },
  { title: 'Agreement', href: '/agreement' },
  { title: 'Recurring consultation', href: `/recurring-consultation?year=${getYear(new Date())}` },
  { title: 'Reporting', href: `/reporting?year=${getYear(new Date()) - 1}` },
  { title: 'Compensation', href: `/compensation?year=${getYear(new Date()) - 1}` },
  { title: 'Invoicing', href: `/invoicing?year=${getYear(new Date()) - 1}` },
  { title: 'General information', href: `/general-information?year=${getYear(new Date())}` },
  { title: 'Years', href: '/years' },
  // { title: 'Statuses', href: '/statuses' },
  { title: 'Recent logs', href: '/logs' },
];

interface Props {
  redirectUrl?: string;
}

export function Topbar({ redirectUrl }: Props) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  return (
    <>
      <AppBar position="static">
        <Toolbar
          variant="dense"
          sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              edge="start"
              color="inherit"
              aria-label="Stages menu"
              sx={{ mr: 2 }}
              onClick={(e) => setAnchorEl(e.currentTarget)}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" color="inherit" component="div">
              CRM System
            </Typography>
          </Box>
          <SearchBox />
          <Stack direction="row" spacing={2}>
            {redirectUrl ? (
              <IconButton href={redirectUrl} color="inherit" aria-label="authenticate against google services">
                <WifiIcon />
              </IconButton>
            ) : null}
            <GlobalCreate />

            <Form method="delete" action="/api/auth">
              <IconButton type="submit" color="inherit" aria-label="logout" sx={{ ml: 'auto' }}>
                <ExitToApp />
              </IconButton>
            </Form>
          </Stack>
        </Toolbar>
      </AppBar>
      <Menu id="basic-menu" anchorEl={anchorEl} open={!!anchorEl} onClose={handleClose}>
        {links.map((link) => (
          <MenuItem
            key={link.title}
            onClick={handleClose}
            component={RLink}
            to={link.href}
            prefetch="intent"
            sx={{ '&:hover': { textDecoration: 'underline' } }}
          >
            {link.title}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
