import { createRequestHandler } from '@remix-run/express';
import compression from 'compression';
import express from 'express';
// import helmet from 'helmet';
import pino from 'pino-http';
import { cleanExpiredSessions } from './cron';

const viteDevServer =
  process.env.NODE_ENV === 'production'
    ? undefined
    : await import('vite').then((vite) =>
        vite.createServer({
          server: { middlewareMode: true },
        }),
      );

const remixHandler = createRequestHandler({
  // @ts-expect-error it works
  build: viteDevServer
    ? () => viteDevServer.ssrLoadModule('virtual:remix/server-build')
    : await import('../build/server/index.js'),
});

cleanExpiredSessions.start();

const app = express();

app.use(compression());

// app.use(helmet());
app.use(
  pino({
    quietReqLogger: true, // turn off the default logging output
    transport: {
      target: 'pino-http-print', // use the pino-http-print transport and its formatting output
      options: {
        destination: 1,
        all: true,
        translateTime: true,
      },
    },
  }),
);

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable('x-powered-by');

// handle asset requests
if (viteDevServer) {
  app.use(viteDevServer.middlewares);
} else {
  // Vite fingerprints its assets so we can cache forever.
  app.use('/assets', express.static('build/client/assets', { immutable: true, maxAge: '1y' }));
}

// Everything else (like favicon.ico) is cached for an hour. You may want to be
// more aggressive with this caching.
app.use(express.static('build/client', { maxAge: '1h' }));

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// handle SSR requests
app.all('*', remixHandler);

const port = process.env.PORT || 4200;
app.listen(port, async () => {
  console.log(`Express server listening at http://localhost:${port}`);
});
