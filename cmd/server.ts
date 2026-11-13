import { createRequestHandler } from '@react-router/express';
import compression from 'compression';
import express from 'express';
import { join } from 'path';
import { pinoHttp } from 'pino-http';
import type { ServerBuild } from 'react-router';

import { cleanExpiredSessions } from './cron.js';
// import helmet from 'helmet';

const viteDevServer =
  process.env.NODE_ENV === 'production'
    ? undefined
    : await import('vite').then((vite) =>
        vite.createServer({
          server: { middlewareMode: true },
        }),
      );

// Resolved relative to the emitted dist/cmd/server.js, not this source file.
const productionBuildPath = '../server/index.js';
const routerHandler = createRequestHandler({
  build: viteDevServer
    ? async () => {
        const { isRunnableDevEnvironment } = await import('vite');
        const environment = viteDevServer.environments.ssr;
        if (!isRunnableDevEnvironment(environment)) throw new Error('Expected a runnable Vite SSR environment');
        return environment.runner.import<ServerBuild>('virtual:react-router/server-build');
      }
    : await import(productionBuildPath),
});

cleanExpiredSessions.start();

const app = express();

app.use(compression());

// app.use(helmet());
app.use(
  pinoHttp({
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
  app.use('/assets', express.static(join(process.cwd(), '/dist/client/assets'), { immutable: true, maxAge: '1y' }));
}

// Everything else (like favicon.ico) is cached for an hour. You may want to be
// more aggressive with this caching.
app.use(express.static(join(process.cwd(), '/dist/client'), { maxAge: '300h' }));

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// handle SSR requests
app.all('*', routerHandler);

const port = process.env.PORT || 4200;
app.listen(port, async () => {
  console.log(`Express server listening at http://localhost:${port}`);
});
