import { createRequire } from 'node:module';

import { pino } from 'pino';

// Vite's SSR caller is virtual; Pino cannot resolve package-name transports from it.
const require = createRequire(import.meta.url);

export const logger = pino({
  transport: { target: require.resolve('pino-pretty'), options: { translateTime: 'UTC:yyyy-MM-dd HH:mm:ss.l o' } },
  level: 'debug',
});
