import { DatabaseError } from 'pg';

import { logger } from '../logger.server';
import { status } from '../schema.server';
import { db } from './db.server';

export interface Status {
  id: string;
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

// export async function deleteStatus(id: string): Promise<string | null> {
//   try {
//     await db.delete(status).where(eq(status.id, id));
//     return null;
//   } catch (e) {
//     return (e as DatabaseError).detail as string;
//   }
// }

// export async function updateStatus(id: string, value: string): Promise<string | null> {
//   try {
//     await db.update(status).set({ name: value }).where(eq(status.id, id));
//     return null;
//   } catch (e) {
//     return (e as DatabaseError).detail as string;
//   }
// }

export async function createStatus(value: string): Promise<string | null> {
  try {
    await db.insert(status).values({ name: value });
    return null;
  } catch (e) {
    return (e as DatabaseError).detail as string;
  }
}
