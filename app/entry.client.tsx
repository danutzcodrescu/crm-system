/**
 * By default, Remix will handle hydrating your app on the client for you.
 * You are free to delete this file if you'd like to, but if you ever want it revealed again, you can run `npx remix reveal` ✨
 * For more information, see https://remix.run/file-conventions/entry.client
 */

import { CssBaseline, ThemeProvider } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { RemixBrowser } from '@remix-run/react';
import { sv } from 'date-fns/locale';
import { startTransition, StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';

import { ClientCacheProvider } from './emotion/emotion-client';
import { theme } from './utils/theme';

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <ClientCacheProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={sv}>
            <RemixBrowser />
          </LocalizationProvider>
        </ThemeProvider>
      </ClientCacheProvider>
    </StrictMode>,
  );
});
