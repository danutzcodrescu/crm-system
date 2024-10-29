import { eq } from 'drizzle-orm';
import { DatabaseError } from 'pg';

import { notesLog } from '../schema.server';
import { db } from './db.server';

export async function deleteLog(id: string): Promise<string | null> {
  try {
    await db.delete(notesLog).where(eq(notesLog.id, id));
    return null;
  } catch (e) {
    return (e as DatabaseError).detail as string;
  }
}

export async function updateLog(id: string, description: string, date: Date): Promise<string | null> {
  try {
    await db.update(notesLog).set({ description, date }).where(eq(notesLog.id, id));
    return null;
  } catch (e) {
    return (e as DatabaseError).detail as string;
  }
}

export async function createLog(employeeId: string, description: string, date: Date): Promise<string | null> {
  try {
    await db.insert(notesLog).values({ employeeId, description, date });
    return null;
  } catch (e) {
    return (e as DatabaseError).detail as string;
  }
}
