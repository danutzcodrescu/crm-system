import { schedule } from 'node-cron';
import { db } from '~/utils/server/repositories/db.server.js';
import { sessions } from '~/utils/server/schema.server.js';
import { lt } from 'drizzle-orm';
import { logger } from '~/utils/server/logger.server.js';

export const cleanExpiredSessions = schedule(
  '00 04 * * * *',
  async () => {
    logger.info('Cleaning expired sessions');
    const result = await db.delete(sessions).where(lt(sessions.expiresAt, new Date())).returning();
    logger.info(`Deleted ${result.length} expired sessions`);
  },
  { scheduled: false, timezone: 'UTC' },
);
