import { existsSync, readFileSync } from 'node:fs';

import * as Sentry from '@sentry/react-router';

import pkg from './package.json' with { type: 'json' };

const metadata = new URL('./dist/sentry-release.json', import.meta.url);
// Prefer the baked release: runtime env must not relabel an already uploaded build.
const release = existsSync(metadata)
  ? JSON.parse(readFileSync(metadata, 'utf8')).release
  : process.env.SENTRY_RELEASE || `crm-system@${pkg.version}`;
const dsn = process.env.SENTRY_DSN || process.env.VITE_SENTRY_DSN;

Sentry.init({
  dsn,
  release,
  environment: process.env.SENTRY_ENVIRONMENT || 'production',
  tracesSampleRate: 0.1,
  enabled: process.env.NODE_ENV === 'production' && Boolean(dsn),
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: false,
    httpBodies: [],
    urlQueryParams: false,
    databaseQueryData: false,
    stackFrameVariables: false,
  },
  // Pino logs are forwarded explicitly after redaction by logger.server.ts.
  // This does not depend on Node's version-sensitive ESM auto-instrumentation.
});
