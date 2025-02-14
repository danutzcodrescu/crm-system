import { vitePlugin as remix } from '@remix-run/dev';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({ isSsrBuild }) => ({
  server: {
    port: 4200,
  },
  ssr: {
    noExternal: process.env.NODE_ENV === 'production' ? [/^@mui\//] : [/^@mui\/x-.{1,}/],
  },
  resolve: {
    alias: [
      {
        find: /^@mui\/icons-material\/(.*)/,
        replacement: '@mui/icons-material/esm/$1',
      },
    ],
  },
  optimizeDeps: {
    exclude: ['@node-rs/argon2', '@node-rs/bcrypt'],
  },
  plugins: [
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
      },
      routes(defineRoutes) {
        return defineRoutes((route) => {
          route('/signin', 'views/login/route.tsx');
          route('/signup', 'views/signup/route.tsx');
          route('/api/auth', 'api/auth/route.ts');
          route('/api/reporting/import', 'api/reporting/import.ts');
          route('/api/municipalities', 'api/municipalities/layout.tsx', () => {
            route('/api/municipalities/:companyId', 'api/municipalities/route.ts');
            route('/api/municipalities/:companyId/responsibles', 'api/municipalities/responsibles.ts');
            route('/api/municipalities/:companyId/responsibles/:responsibleId', 'api/municipalities/responsible.ts');
          });
          route('/api/logs', 'api/notes-log/layout.tsx', () => {
            route('/api/logs/:companyId', 'api/notes-log/companyLog.ts');
            route('/api/logs/:companyId/:logId', 'api/notes-log/log.ts');
          });
          route('/', 'views/layout.tsx', () => {
            route('', 'views/dashboard/route.tsx', { index: true });
            route('/initial-consultation', 'views/initialConsultation/route.tsx');
            route('/agreement', 'views/agreement/route.tsx');
            route('/recurring-consultation', 'views/recurringConsultation/route.tsx');
            route('/reporting', 'views/reporting/route.tsx');
            route('/general-information', 'views/generalInformation/route.tsx');
            route('/compensation', 'views/compensation/route.tsx');
            route('/invoicing', 'views/invoicing/route.tsx');
            route('municipalities', 'views/municipalities/layout.tsx', () => {
              route('', 'views/municipalities/route.tsx', { index: true });
              route(':municipalityId', 'views/municipalities/municipality.tsx');
            });
            route('/statuses', 'views/statuses/route.tsx');
            route('/years', 'views/years/route.tsx');
          });
        });
      },
    }),
    tsconfigPaths(),
  ],
  build: isSsrBuild ? { target: 'ESNext' } : {},
}));
