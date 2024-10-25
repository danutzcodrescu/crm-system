import { vitePlugin as remix } from '@remix-run/dev';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  server: {
    port: 4200,
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
          route('/', 'views/layout.tsx', () => {
            route('', 'views/dashboard/route.tsx', { index: true });
            route('/statuses', 'views/statuses/route.tsx');
            route('/years', 'views/years/route.tsx');
            route('/contacts', 'views/employees/route.tsx', () => {
              route(':contactId', 'views/employees/contact.tsx');
            });
          });
        });
      },
    }),
    tsconfigPaths(),
  ],
});
