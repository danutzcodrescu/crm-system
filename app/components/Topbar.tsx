import ExitToApp from '@mui/icons-material/ExitToApp';
import MenuIcon from '@mui/icons-material/Menu';
import { AppBar, Box, IconButton, Link, Menu, MenuItem, Toolbar, Typography } from '@mui/material';
import { Form, Link as RLink } from '@remix-run/react';
import { getYear } from 'date-fns';
import { useCallback, useState } from 'react';

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
        <MenuItem onClick={handleClose}>
          <Link component={RLink} to="/" prefetch="intent">
            Dashboard
          </Link>
        </MenuItem>
        <MenuItem onClick={handleClose}>
          <Link component={RLink} to="/initial-consultation" prefetch="intent">
            Initial Consultation
          </Link>
        </MenuItem>
        <MenuItem onClick={handleClose}>
          <Link component={RLink} to="/agreement" prefetch="intent">
            Agreement
          </Link>
        </MenuItem>
        <MenuItem onClick={handleClose}>
          <Link component={RLink} to={`/recurring-consultation?year=${getYear(new Date())}`} prefetch="intent">
            Recurring consultation
          </Link>
        </MenuItem>
        <MenuItem onClick={handleClose}>
          <Link component={RLink} to={`/reporting?year=${getYear(new Date())}`} prefetch="intent">
            Reporting
          </Link>
        </MenuItem>
        <MenuItem onClick={handleClose}>
          <Link component={RLink} to="/years/" prefetch="intent">
            Years
          </Link>
        </MenuItem>
      </Menu>
    </>
  );
}
