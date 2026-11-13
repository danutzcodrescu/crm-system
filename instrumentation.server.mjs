import * as Sentry from '@sentry/react-router';

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  tracesSampleRate: 1,
  release: `crm-system@${process.env.VITE_REACT_APP_VERSION}`,
  enabled: process.env.NODE_ENV === 'production',
});
