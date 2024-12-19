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
          route('/api/users', 'api/users/route.ts');
          route('/', 'views/layout.tsx', () => {
            route('', 'views/dashboard/route.tsx', { index: true });
            // route('/statuses', 'views/statuses/route.tsx');
            // route('/years', 'views/years/route.tsx');
            // route('/contacts', 'views/employees/layout.tsx', () => {
            //   route('', 'views/employees/route.tsx', { index: true });
            //   route(':contactId', 'views/employees/contact.tsx');
            // });
            // route('/communes', 'views/companies/layout.tsx', () => {
            //   route('', 'views/companies/route.tsx', { index: true });
            //   route(':companyId', 'views/companies/company.tsx');
            // });
            // route('/api/companies', 'api/companies/layout.tsx', () => {
            //   route(':companyId', 'api/companies/route.tsx');
            // });
            // route('/api/notes-log', 'api/notes-log/layout.tsx', () => {
            //   // route('', 'api/notes-log/route.tsx', { index: true });
            //   route(':logId', 'api/notes-log/route.tsx');
            // });
            // route('/api/reminders', 'api/reminders/layout.tsx', () => {
            //   route(':reminderId', 'api/reminders/route.tsx');
            // });
            // route('/api/import/communes', 'api/import/communes.ts');
          });
        });
      },
    }),
    tsconfigPaths(),
  ],
  build: isSsrBuild ? { target: 'ESNext' } : {},
}));
