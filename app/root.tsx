import { captureRemixErrorBoundaryError } from '@sentry/remix';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import { withEmotionCache } from '@emotion/react';
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useRouteError } from '@remix-run/react';
import { PropsWithChildren } from 'react';

import { useInjectStyles } from './emotion/emotion-client';

export const Layout = withEmotionCache(({ children }: PropsWithChildren, cache) => {
  useInjectStyles(cache);
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <meta name="emotion-insertion-point" content="emotion-insertion-point" />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
});

export const ErrorBoundary = () => {
  const error = useRouteError();
  captureRemixErrorBoundaryError(error);
  return <div>Something went wrong</div>;
};

export default function App() {
  return <Outlet />;
}
