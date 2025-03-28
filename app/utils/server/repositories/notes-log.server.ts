import {desc, eq } from 'drizzle-orm';
import { DatabaseError } from 'pg';

import { logger } from '../logger.server';
import { companies, logs } from '../schema.server';
import { db } from './db.server';

export interface LogForCompany {
  id: string;
  description: string;
  date: Date;
}

export async function deleteLog(id: string): Promise<string | null> {
  try {
    logger.info('Deleting log', id);
    await db.delete(logs).where(eq(logs.id, id));
    return null;
  } catch (e) {
    logger.error(e);
    return `Could not delete log: ${(e as DatabaseError).detail}`;
  }
}

export async function updateLog(id: string, description: string, date: Date): Promise<string | null> {
  try {
    logger.info('Updating log', id);
    await db.update(logs).set({ description, date }).where(eq(logs.id, id));
    return null;
  } catch (e) {
    logger.error(e);
    return `Could not update log: ${(e as DatabaseError).detail}`;
  }
}

export async function createLog(companyId: string, description: string, date: Date): Promise<string | null> {
  try {
    logger.info('Creating log for company', companyId);
    await db.insert(logs).values({ companyId, description, date });
    return null;
  } catch (e) {
    return `Could not create log: ${(e as DatabaseError).detail}`;
  }
}

export async function getLogsForCompany(companyId: string): Promise<[string | undefined, LogForCompany[] | undefined]> {
  try {
    logger.info('Fetching logs for company', companyId);
    return [
      undefined,
      await db
        .select({
          id: logs.id,
          description: logs.description,
          date: logs.date,
        })
        .from(logs)
        .where(eq(logs.companyId, companyId))
        .orderBy(desc(logs.date)),
    ];
  } catch (e) {
    logger.error(e);
    return [`Could not retrieve logs for company`, undefined];
  }
}

export interface LogsWithCompanyDetails {
  id: string;
  companyId: string;
  companyName: string;
  description: string;
  date: Date;
}

export async function getRecentLogs(): Promise<[string | undefined, LogsWithCompanyDetails[] | undefined]> {
  try {
    logger.info('Fetching logs for period');
    return [
      undefined,
      (await db
        .select({
          id: logs.id,
          companyId: logs.companyId,
          companyName: companies.name,
          description: logs.description,
          date: logs.date,
        })
        .from(logs)
        .leftJoin(companies, eq(logs.companyId, companies.id))
        .limit(50)
        .orderBy(desc(logs.date))) as LogsWithCompanyDetails[],
    ];
  } catch (e) {
    logger.error('Could not retrieve logs for period', e);
    return [`Could not retrieve logs for period`, undefined];
  }
}
