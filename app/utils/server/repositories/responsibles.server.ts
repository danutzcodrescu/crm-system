import { eq } from 'drizzle-orm';

import { logger } from '../logger.server';
import { responsibles } from '../schema.server';
import { db } from './db.server';

interface ResponsibleArgs {
  companyId: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  title?: string;
}

export interface ResponsibleData extends ResponsibleArgs {
  id: string;
}

export async function createNewResponsible(args: ResponsibleArgs): Promise<[null, string] | [string, null]> {
  try {
    logger.info('Creating new responsible');
    await db.insert(responsibles).values(args);
    return [null, 'Responsible created successfully'];
  } catch (e) {
    logger.error(e);
    return ['could not create new responsible', null];
  }
}

export async function updateResponsible(
  args: Omit<ResponsibleData, 'companyId'> & { id: string },
): Promise<[null, string] | [string, null]> {
  try {
    logger.info('Updating responsible');
    await db.update(responsibles).set(args).where(eq(responsibles.id, args.id));
    return [null, 'Responsible updated successfully'];
  } catch (e) {
    logger.error(e);
    return ['could not update responsible data', null];
  }
}

export async function deleteResponsible(id: string): Promise<[null, string] | [string, null]> {
  try {
    logger.info('Deleting responsible');
    await db.delete(responsibles).where(eq(responsibles.id, id));
    return [null, 'Responsible deleted successfully'];
  } catch (e) {
    logger.error(e);
    return ['could not delete responsible', null];
  }
}

export async function getResponsiblesForMunicipality(
  companyId: string,
): Promise<[null, ResponsibleData[]] | [string, null]> {
  try {
    logger.info('Getting responsibles for municipality');
    const data = await db
      .select({
        id: responsibles.id,
        companyId: responsibles.companyId,
        name: responsibles.name,
        email: responsibles.email,
        title: responsibles.title,
        phoneNumber: responsibles.phoneNumber,
      })
      .from(responsibles)
      .where(eq(responsibles.companyId, companyId));
    return [null, data as ResponsibleData[]];
  } catch (e) {
    logger.error(e);
    return ['could not delete responsible', null];
  }
}

export async function bulkImportResponsibles(
  data: Record<string, (typeof responsibles.$inferInsert)[]>,
): Promise<string | null> {
  try {
    logger.info('Importing responsibles');
    await Promise.all(
      Object.entries(data).map((entry) => {
        return db.transaction(async (trx) => {
          await trx.delete(responsibles).where(eq(responsibles.companyId, entry[0]));
          await trx.insert(responsibles).values(entry[1]);
        });
      }),
    );
    return null;
  } catch (e) {
    logger.error(e);
    return 'could not import reporting data';
  }
}
