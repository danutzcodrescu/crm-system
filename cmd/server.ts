import { createRequestHandler } from '@react-router/express';
import * as Sentry from '@sentry/react-router';
import compression from 'compression';
import express from 'express';
import { join } from 'path';
import type { ServerBuild } from 'react-router';

import { createRequestLogger, logger } from '~/utils/server/logger.server.js';

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
// Caddy is the single reverse proxy and forwards the original HTTPS protocol.
app.set('trust proxy', 1);

app.use(compression());

// app.use(helmet());
app.use(createRequestLogger());

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable('x-powered-by');

// Defense in depth: never serve source maps, even if copied by mistake.
app.get(/\.map$/, (_req, res) => res.sendStatus(404));

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
app.all('/{*splat}', routerHandler);

// React Router reports its own errors; this also catches Express middleware and
// adapter failures that happen before a React Router request exists.
Sentry.setupExpressErrorHandler(app);

const port = process.env.PORT || 4200;
app.listen(port, async () => {
  logger.info({ port }, 'Express server listening');
});
