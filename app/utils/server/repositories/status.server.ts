import { DatabaseError } from 'pg';
import { eq } from 'drizzle-orm';

import { logger } from '../logger.server';
import { status } from '../schema.server';
import { db } from './db.server';

export interface Status {
  id: number;
  name: string;
}

export async function getAllStatuses(): Promise<[string, null] | [null, Status[]]> {
  try {
    const data = await db.select({ id: status.id, name: status.name }).from(status).orderBy(status.name);
    return [null, data as unknown as Status[]];
  } catch (e) {
    logger.error(e);
    return ['could not fetch initial consultation data', null];
  }
}

export async function deleteStatus(id: number): Promise<string | null> {
  try {
    logger.info('Deleting status', id);
    await db.delete(status).where(eq(status.id, id));
    logger.info('Status deleted', id);
    return null;
  } catch (e) {
    logger.error(e);
    return (e as DatabaseError).detail as string;
  }
}

export async function updateStatus(id: number, value: string): Promise<string | null> {
  try {
    logger.info('Updating status', id);
    await db.update(status).set({ name: value }).where(eq(status.id, id));
    logger.info('Status updated', id);
    return null;
  } catch (e) {
    logger.error(e);
    return (e as DatabaseError).detail as string;
  }
}

export async function createStatus(value: string): Promise<string | null> {
  try {
    logger.info('Creating status', value);
    await db.insert(status).values({ name: value });
    logger.info('Status created', value);
    return null;
  } catch (e) {
    logger.error(e);
    return (e as DatabaseError).detail as string;
  }
}
