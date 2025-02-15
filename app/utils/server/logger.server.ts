import { pino } from 'pino';

export const logger = pino({
  transport: { target: 'pino-pretty', options: { translateTime: 'UTC:yyyy-MM-dd HH:mm:ss.l o' } },
  level: 'debug',
});
