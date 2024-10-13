import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import { CssBaseline, ThemeProvider } from '@mui/material';
import { json, Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from '@remix-run/react';
import { HoneypotProvider } from 'remix-utils/honeypot/react';

import { theme } from './utils/client/theme';
import { honeypot } from './utils/server/honeypot.server';

export const loader = () => {
  return json({ honeypotInputProps: honeypot.getInputProps() });
};

export function Layout({ children }: { children: React.ReactNode }) {
  const { honeypotInputProps } = useLoaderData<typeof loader>();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <CssBaseline />
        <ThemeProvider theme={theme}>
          <HoneypotProvider {...honeypotInputProps}>{children}</HoneypotProvider>
        </ThemeProvider>

        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
