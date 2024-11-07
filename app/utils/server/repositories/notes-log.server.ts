import { desc, eq } from 'drizzle-orm';
import { DatabaseError } from 'pg';

import { employees, notesLog } from '../schema.server';
import { db } from './db.server';

export interface LogForCompany {
  id: string;
  description: string;
  date: Date;
  employeeId: string | null;
  employeeName: string | null;
}

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

export async function getLogsForCompany(companyId: string): Promise<[string | undefined, LogForCompany[] | undefined]> {
  try {
    return [
      undefined,
      await db
        .select({
          id: notesLog.id,
          description: notesLog.description,
          date: notesLog.date,
          employeeId: employees.id,
          employeeName: employees.name,
        })
        .from(notesLog)
        .leftJoin(employees, eq(notesLog.employeeId, employees.id))
        .where(eq(employees.companyId, companyId))
        .orderBy(desc(notesLog.date)),
    ];
  } catch (e) {
    return [(e as DatabaseError).detail, undefined];
  }
}
