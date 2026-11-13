import { CssBaseline, ThemeProvider } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import * as Sentry from '@sentry/react-router';
import { sv } from 'date-fns/locale';
import { startTransition, StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { HydratedRouter } from 'react-router/dom';

import { ClientCacheProvider } from './emotion/emotion-client';
import { theme } from './utils/theme';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  tracesSampleRate: 1,
  release: `crm-system@${import.meta.env.VITE_REACT_APP_VERSION}`,
  enabled: import.meta.env.NODE_ENV === 'production',
  integrations: [
    Sentry.reactRouterTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
});

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <ClientCacheProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={sv}>
            <HydratedRouter
              onError={(error, info) => {
                console.error('React Router navigation failed', {
                  error,
                  pathname: info.location.pathname,
                  pattern: info.pattern,
                  componentStack: info.errorInfo?.componentStack,
                });
                Sentry.sentryOnError(error, info);
              }}
            />
          </LocalizationProvider>
        </ThemeProvider>
      </ClientCacheProvider>
    </StrictMode>,
    {
      onRecoverableError(error, info) {
        console.error('React hydration recovered from an error', {
          error,
          pathname: window.location.pathname,
          componentStack: info.componentStack,
        });
        Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
      },
    },
  );
});
