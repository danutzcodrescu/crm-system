import ExitToApp from '@mui/icons-material/ExitToApp';
import MenuIcon from '@mui/icons-material/Menu';
import { AppBar, Box, IconButton, Link, Menu, MenuItem, Toolbar, Typography } from '@mui/material';
import { Form, Link as RLink } from '@remix-run/react';
import { getYear } from 'date-fns';
import { useCallback, useState } from 'react';

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
        <Toolbar variant="dense" sx={{ display: 'flex' }}>
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
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
          <MenuItem key={link.title} onClick={handleClose}>
            <Link component={RLink} to={link.href} prefetch="intent">
              {link.title}
            </Link>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
