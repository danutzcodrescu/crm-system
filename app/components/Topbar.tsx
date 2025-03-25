import ExitToApp from '@mui/icons-material/ExitToApp';
import MenuIcon from '@mui/icons-material/Menu';
import { AppBar, Box, IconButton, Menu, MenuItem, Toolbar, Typography } from '@mui/material';
import { Form, Link as RLink } from '@remix-run/react';
import { getYear } from 'date-fns';
import { useCallback, useState } from 'react';
import { SearchBox } from './topbar/SearchBox';
import { ClientOnly } from 'remix-utils/client-only';

const links = [
  { title: 'Dashboard', href: '/' },
  { title: 'Municipalities', href: '/municipalities' },
  { title: 'Initial Consultation', href: '/initial-consultation' },
  { title: 'Agreement', href: '/agreement' },
  { title: 'Recurring consultation', href: `/recurring-consultation?year=${getYear(new Date())}` },
  { title: 'Reporting', href: `/reporting?year=${getYear(new Date()) - 1}` },
  { title: 'Compensation', href: `/compensation?year=${getYear(new Date()) - 1}` },
  { title: 'Invoicing', href: `/invoicing?year=${getYear(new Date()) - 1}` },
  { title: 'General information', href: `/general-information?year=${getYear(new Date())}` },
  { title: 'Years', href: '/years' },
  { title: 'Statuses', href: '/statuses' },
];

export function Topbar() {
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
          <Form method="delete" action="/api/auth">
            <IconButton type="submit" color="inherit" aria-label="logout" sx={{ ml: 'auto' }}>
              <ExitToApp />
            </IconButton>
          </Form>
        </Toolbar>
      </AppBar>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
      >
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
