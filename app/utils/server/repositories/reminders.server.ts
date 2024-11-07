import { and, asc, eq, or, sql } from 'drizzle-orm';
import { DatabaseError } from 'pg';

import { employees, reminders } from '../schema.server';
import { db } from './db.server';

export interface Reminder {
  id: string;
  date: Date;
  description: string | null;
  employeeName: string | null;
  employeeId: string | null;
  completed: boolean;
  type: 'reminder' | 'meeting';
  warning: boolean;
}

export async function getRemindersPerCompany(companyId: string): Promise<[string | null, Reminder[] | null]> {
  try {
    return [
      null,
      await db
        .select({
          id: reminders.id,
          date: reminders.date,
          description: reminders.description,
          employeeName: employees.name,
          employeeId: reminders.employeeId,
          completed: reminders.completed,
          type: reminders.type,
          warning: sql<boolean>`CASE WHEN reminders.type = 'reminder' AND reminders.date < NOW() THEN true ELSE false END`,
        })
        .from(reminders)
        .where(
          or(
            and(eq(reminders.companyId, companyId), eq(reminders.type, 'reminder'), eq(reminders.completed, false)),
            eq(reminders.type, 'meeting'),
          ),
        )
        .leftJoin(employees, eq(reminders.employeeId, employees.id))
        .orderBy(asc(reminders.date)),
    ];
  } catch (e) {
    return [(e as DatabaseError).detail as string, null];
  }
}

export async function deleteReminder(id: string) {
  try {
    await db.delete(reminders).where(eq(reminders.id, id));
    return null;
  } catch (e) {
    return (e as DatabaseError).detail as string;
  }
}

interface CreateReminder {
  date: Date;
  description?: string;
  employeeId?: string;
  companyId: string;
  type: 'reminder' | 'meeting';
  completed?: boolean;
}

export async function createReminder(reminder: CreateReminder): Promise<string | null> {
  try {
    await db.insert(reminders).values(reminder);
    return null;
  } catch (e) {
    return (e as DatabaseError).detail as string;
  }
}

export async function updateReminder(id: string, reminder: Omit<CreateReminder, 'type'>): Promise<string | null> {
  try {
    await db.update(reminders).set(reminder).where(eq(reminders.id, id));
    return null;
  } catch (e) {
    return (e as DatabaseError).detail as string;
  }
}
