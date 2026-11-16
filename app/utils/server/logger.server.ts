import { createRequire } from 'node:module';

import * as Sentry from '@sentry/react-router';
import { type DestinationStream, pino } from 'pino';
import { pinoHttp } from 'pino-http';

// Vite's SSR caller is virtual; Pino cannot resolve package-name transports from it.
const require = createRequire(import.meta.url);

export function createAppLogger({
  production = process.env.NODE_ENV === 'production',
  destination = process.stdout,
}: { production?: boolean; destination?: DestinationStream } = {}) {
  const options = {
    level: process.env.LOG_LEVEL || (production ? 'info' : 'debug'),
    redact: {
      paths: [
        'password',
        'token',
        'secret',
        'authorization',
        'cookie',
        '*.password',
        '*.token',
        '*.secret',
        '*.authorization',
        '*.cookie',
        'req.headers.authorization',
        'req.headers.cookie',
        'req.body',
        'res.headers["set-cookie"]',
      ],
      censor: '[REDACTED]',
    },
  };
  if (!production) {
    return pino({
      ...options,
      transport: { target: require.resolve('pino-pretty'), options: { translateTime: 'UTC:yyyy-MM-dd HH:mm:ss.l o' } },
    });
  }
  return pino(
    options,
    pino.multistream([
      { level: 'trace', stream: destination },
      {
        level: 'warn',
        stream: {
          write(line: string) {
            // Pino serializes Errors and redacts credentials BEFORE this stream.
            // An explicit bridge works on Node 26 without an ESM patching hook.
            const { level, msg, ...attributes } = JSON.parse(line);
            const log = level >= 60 ? Sentry.logger.fatal : level >= 50 ? Sentry.logger.error : Sentry.logger.warn;
            log(msg || 'Application log', { ...attributes, 'pino.level': level });
          },
        },
      },
    ]),
  );
}

export const logger = createAppLogger();

export function createRequestLogger(appLogger = logger) {
  return pinoHttp({
    logger: appLogger,
    serializers: {
      // Never serialize headers, cookies, query parameters or bodies.
      req: (request) => ({ id: request.id, method: request.method, pathname: request.url?.split('?')[0] }),
      res: (response) => ({ statusCode: response.statusCode }),
    },
  });
}
