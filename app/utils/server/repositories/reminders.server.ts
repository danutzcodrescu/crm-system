import { asc, count, eq, InferInsertModel, sql } from 'drizzle-orm';

import { logger } from '../logger.server';
import { companies, logs, reminders } from '../schema.server';
import { db } from './db.server';

export async function createReminder(data: InferInsertModel<typeof reminders>, logId?: string): Promise<string | null> {
  try {
    logger.info('Creating reminder');
    db.transaction(async (tx) => {
      const reminder = await tx.insert(reminders).values(data).returning({ id: reminders.id });
      if (logId) {
        await tx.update(logs).set({ reminderId: reminder[0].id }).where(eq(logs.id, logId));
      }
    });
    return null;
  } catch (e) {
    logger.error(`Error creating reminder: ${e}`);
    return 'Error creating reminder';
  }
}

export async function changeReminderStatus(reminderId: string, status: boolean): Promise<string | null> {
  try {
    logger.info('Changing reminder status');
    await db.update(reminders).set({ status }).where(eq(reminders.id, reminderId));
    return null;
  } catch (e) {
    logger.error(`Error changing reminder status: ${e}`);
    return 'Error changing reminder status';
  }
}

export interface ReminderData {
  id: string;
  date: Date;
  description: string | null;
  companyId: string;
  companyName: string | null;
}

export async function getAllRecentReminders(): Promise<[string | null, ReminderData[] | null]> {
  try {
    logger.info('Getting all reminders');
    const remindersData = await db
      .select({
        id: reminders.id,
        date: reminders.dueDate,
        description: reminders.description,
        companyId: reminders.companyId,
        companyName: companies.name,
      })
      .from(reminders)
      .where(
        sql`${reminders.status} = FALSE AND ${reminders.dueDate} >= (CURRENT_DATE - INTERVAL '7 days')::timestamptz`,
      )
      .leftJoin(companies, eq(reminders.companyId, companies.id))
      .orderBy(asc(reminders.dueDate));
    return [null, remindersData];
  } catch (e) {
    logger.error(`Error getting all reminders: ${e}`);
    return ['Error getting all reminders', null];
  }
}

export async function getRemindersCount(): Promise<[string | null, number | null]> {
  try {
    logger.info('Getting all reminders count');
    const remindersData = await db.select({ count: count() }).from(reminders).where(eq(reminders.status, false));
    return [null, remindersData[0].count];
  } catch (e) {
    logger.error(`Error getting all reminders count: ${e}`);
    return ['Error getting all reminders count', null];
  }
}

export async function getAllReminders(): Promise<[string | null, ReminderData[] | null]> {
  try {
    logger.info('Getting all reminders');
    const remindersData = await db
      .select({
        id: reminders.id,
        date: reminders.dueDate,
        description: reminders.description,
        companyId: reminders.companyId,
        companyName: companies.name,
      })
      .from(reminders)
      .leftJoin(companies, eq(reminders.companyId, companies.id))
      .where(eq(reminders.status, false))
      .orderBy(asc(reminders.dueDate));
    return [null, remindersData];
  } catch (e) {
    logger.error(`Error getting all reminders: ${e}`);
    return ['Error getting all reminders', null];
  }
}
