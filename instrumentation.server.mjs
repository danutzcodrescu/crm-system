import * as Sentry from '@sentry/remix';

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  tracesSampleRate: 1,
  autoInstrumentRemix: true,
  release: `crm-system@${process.env.VITE_REACT_APP_VERSION}`,
  enabled: process.env.NODE_ENV === 'production',
});
