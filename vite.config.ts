import { resolve } from 'node:path';

import { reactRouter } from '@react-router/dev/vite';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

import pkg from './package.json';

export default defineConfig(({ isSsrBuild }) => ({
  // Each smoke server owns both ports; never connect to another dev server's HMR socket.
  ...(process.env.NODE_ENV === 'test' && process.env.CRM_SMOKE_TEST === '1'
    ? { server: { hmr: { port: Number(process.env.CRM_SMOKE_HMR_PORT) } } }
    : {}),
  ssr: {
    noExternal: process.env.NODE_ENV === 'production' ? [/^@mui\//] : [/^@mui\/x-.{1,}/],
  },
  optimizeDeps: {
    // Infisical uses Node-only AWS credential providers. Never browser-prebundle
    // it when development dependency discovery encounters server-side imports.
    exclude: ['@node-rs/argon2', '@node-rs/bcrypt', '@infisical/sdk'],
    ...(process.env.NODE_ENV === 'test' && process.env.CRM_SMOKE_TEST === '1'
      ? { entries: ['app/root.tsx', 'app/entry.client.tsx', 'app/views/**/*.tsx', 'app/components/**/*.tsx'] }
      : {}),
  },
  plugins: [
    // Test-only replacement at the external secret boundary; auth, SQL and routes stay real.
    ...(process.env.NODE_ENV === 'test' && process.env.CRM_SMOKE_TEST === '1'
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
    tsconfigPaths(),
    sentryVitePlugin({
      authToken: process.env.SENTRY_AUTH_TOKEN,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      release: {
        name: `crm-system@${pkg.version}`,
      },
    }),
  ],
  build: { sourcemap: true, ...(isSsrBuild ? { target: 'ESNext' } : {}) },
}));
