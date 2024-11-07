import { eq } from 'drizzle-orm';
import { DatabaseError } from 'pg';

import { status } from '../schema.server';
import { db } from './db.server';

export async function getAllStatuses() {
  return db.select({ id: status.id, name: status.name }).from(status).orderBy(status.name);
}

export async function deleteStatus(id: string): Promise<string | null> {
  try {
    await db.delete(status).where(eq(status.id, id));
    return null;
  } catch (e) {
    return (e as DatabaseError).detail as string;
  }
}

export async function updateStatus(id: string, value: string): Promise<string | null> {
  try {
    await db.update(status).set({ name: value }).where(eq(status.id, id));
    return null;
  } catch (e) {
    return (e as DatabaseError).detail as string;
  }
}

export async function createStatus(value: string): Promise<string | null> {
  try {
    await db.insert(status).values({ name: value });
    return null;
  } catch (e) {
    return (e as DatabaseError).detail as string;
  }
}
