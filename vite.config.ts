import { resolve } from 'node:path';

import { reactRouter } from '@react-router/dev/vite';
import { sentryReactRouter } from '@sentry/react-router/vite';
import { defineConfig } from 'vite';

import pkg from './package.json' with { type: 'json' };

export default defineConfig((config) => ({
  define: {
    'import.meta.env.VITE_SENTRY_RELEASE': JSON.stringify(process.env.SENTRY_RELEASE || `crm-system@${pkg.version}`),
  },
  resolve: { tsconfigPaths: true },
  server: {
    // Playwright trace HTML is output, not an application entry. Watching it
    // creates a reload/trace-write feedback loop that interrupts hydration.
    watch: {
      ignored: ['**/playwright/.cache/**', '**/test-results/**', '**/playwright-report/**', '**/blob-report/**'],
    },
    // Each smoke server owns both ports; never use another server's HMR socket.
    ...(process.env.NODE_ENV === 'development' && process.env.CRM_SMOKE_TEST === '1'
      ? { hmr: { port: Number(process.env.CRM_SMOKE_HMR_PORT) } }
      : {}),
  },
  ssr: {
    noExternal: process.env.NODE_ENV === 'production' ? [/^@mui\//] : [/^@mui\/x-.{1,}/],
  },
  optimizeDeps: {
    // Infisical uses Node-only AWS credential providers. Never browser-prebundle
    // it when development dependency discovery encounters server-side imports.
    exclude: ['@node-rs/argon2', '@node-rs/bcrypt', '@infisical/sdk'],
    ...(process.env.NODE_ENV === 'development' && process.env.CRM_SMOKE_TEST === '1'
      ? { entries: ['app/root.tsx', 'app/entry.client.tsx', 'app/views/**/*.tsx', 'app/components/**/*.tsx'] }
      : {}),
  },
  plugins: [
    // Test-only replacement at the external secret boundary; auth, SQL and routes stay real.
    ...(process.env.NODE_ENV === 'development' && process.env.CRM_SMOKE_TEST === '1'
      ? [
          {
            name: 'smoke-secrets',
            enforce: 'pre' as const,
            resolveId(source: string) {
              if (/(?:^|\/)infisical\.server(?:\.ts)?$/.test(source)) {
                return resolve('e2e/support/secrets.server.ts');
              }
            },
          },
        ]
      : []),
    reactRouter(),
    sentryReactRouter(
      {
        telemetry: false,
        // Final processing runs after tsc too, covering the custom Express server.
        sourcemaps: { disable: 'disable-upload' },
        release: {
          name: process.env.SENTRY_RELEASE || `crm-system@${pkg.version}`,
          create: false,
          finalize: false,
        },
      },
      config,
    ),
  ],
  build: { sourcemap: 'hidden' },
  environments: {
    ssr: { build: { target: 'ESNext' } },
  },
}));
