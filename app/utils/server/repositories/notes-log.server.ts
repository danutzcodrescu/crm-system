import { and, desc, eq } from 'drizzle-orm';
import { DatabaseError } from 'pg';

import { logger } from '../logger.server';
import { companies, logs, reminders } from '../schema.server';
import { db } from './db.server';

export interface LogForCompany {
  id: string;
  description: string;
  date: Date;
  reminderId?: string | null;
  reminderDescription?: string | null;
  reminderDueDate?: Date | null;
  reminderStatus?: boolean | null;
}

export async function deleteLog(id: string): Promise<string | null> {
  try {
    logger.info(`Deleting log ${id}`);
    await db.delete(logs).where(eq(logs.id, id));
    return null;
  } catch (e) {
    logger.error(e);
    return `Could not delete log: ${(e as DatabaseError).detail}`;
  }
}

export async function updateLog(
  id: string,
  description: string,
  date: Date,
  reminder?: {
    companyId: string;
    reminderId?: string;
    reminderDueDate: Date;
    reminderStatus?: boolean;
    reminderDescription?: string;
  },
): Promise<string | null> {
  try {
    logger.info(`Updating log ${id}`);
    db.transaction(async (tx) => {
      let reminderId: string | undefined;
      if (!reminder?.reminderId && reminder?.reminderDueDate) {
        const result = await tx
          .insert(reminders)
          .values({
            dueDate: reminder.reminderDueDate,
            description: reminder.reminderDescription,
            companyId: reminder.companyId,
          })
          .returning({ id: reminders.id });
        reminderId = result[0].id;
      }
      await tx
        .update(logs)
        .set({ description, date, reminderId: reminderId ?? reminder?.reminderId })
        .where(eq(logs.id, id));
      if (reminder?.reminderId) {
        await tx
          .update(reminders)
          .set({
            dueDate: reminder.reminderDueDate,
            status: reminder.reminderStatus,
            description: reminder.reminderDescription,
          })
          .where(eq(reminders.id, reminder.reminderId));
      }
    });
    return null;
  } catch (e) {
    logger.error(e);
    return `Could not update log: ${(e as DatabaseError).detail}`;
  }
}

export async function createLog(
  companyId: string,
  description: string,
  date: Date,
  reminderDueDate?: Date,
  reminderDescription?: string,
): Promise<string | null> {
  try {
    logger.info(`Creating log for company ${companyId}`);
    await db.transaction(async (tx) => {
      let reminderId: string | undefined;
      if (reminderDueDate) {
        const data = await tx
          .insert(reminders)
          .values({
            companyId,
            description: reminderDescription,
            dueDate: reminderDueDate,
          })
          .returning({ id: reminders.id });
        reminderId = data[0].id;
      }
      await tx.insert(logs).values({ companyId, description, date, reminderId });
    });
    return null;
  } catch (e) {
    return `Could not create log: ${(e as DatabaseError).detail}`;
  }
}

export async function getLogsForCompany(companyId: string): Promise<[string | undefined, LogForCompany[] | undefined]> {
  try {
    logger.info(`Fetching logs for company ${companyId}`);
    return [
      undefined,
      await db
        .select({
          id: logs.id,
          description: logs.description,
          date: logs.date,
          reminderId: reminders.id,
          reminderDescription: reminders.description,
          reminderDueDate: reminders.dueDate,
          reminderStatus: reminders.status,
        })
        .from(logs)
        .where(eq(logs.companyId, companyId))
        .leftJoin(reminders, and(eq(logs.reminderId, reminders.id), eq(reminders.status, false)))
        .orderBy(desc(logs.date), desc(logs.updatedAt)),
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
  reminderDueDate: Date | null;
  reminderDescription: string | null;
  reminderId: string | null;
  reminderStatus: boolean | null;
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
          reminderId: reminders.id,
          reminderDueDate: reminders.dueDate,
          reminderDescription: reminders.description,
          reminderStatus: reminders.status,
        })
        .from(logs)
        .leftJoin(companies, eq(logs.companyId, companies.id))
        .leftJoin(reminders, and(eq(logs.reminderId, reminders.id), eq(reminders.status, false)))
        .limit(50)
        .orderBy(desc(logs.date))) as LogsWithCompanyDetails[],
    ];
  } catch (e) {
    logger.error(`Could not retrieve logs for period: ${e}`);
    return [`Could not retrieve logs for period`, undefined];
  }
}
