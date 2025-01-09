import { eq, ilike, InferSelectModel, sql } from 'drizzle-orm';
import { DatabaseError } from 'pg';

import { logger } from '../logger.server';
import { companies } from '../schema.server';
import { db } from './db.server';

export async function getCompanies(
  name?: string,
): Promise<[string | undefined, { id: string; name: string }[] | undefined]> {
  try {
    if (name) {
      // TODO maybe convert it to use pgvector to account for wrong spelling
      return [
        undefined,
        await db
          .select({ id: companies.id, name: companies.name })
          .from(companies)
          .where(ilike(companies.name, `%${name}%`)),
      ];
    } else {
      return [undefined, await db.select({ id: companies.id, name: companies.name }).from(companies)];
    }
  } catch (e) {
    return [(e as DatabaseError).detail, undefined];
  }
}

export type CompanyTable = Pick<InferSelectModel<typeof companies>, 'id' | 'name' | 'statusId'> & {
  statusName: string | null;
};

export async function getFistRecurringConsultationYearFormCompany(
  id: string,
): Promise<[string | undefined, number | undefined]> {
  try {
    logger.info('Getting first recurring consultation year for company id: ', id);
    const result = await db
      .select({ year: sql<number>`${companies.consultations}[1]` })
      .from(companies)
      .where(eq(companies.id, id));
    return [undefined, result[0]?.year];
  } catch (e) {
    logger.error(e);
    return [(e as DatabaseError).detail, undefined];
  }
}

export async function updateRecurringConsultations(
  id: string,
  years: number[],
): Promise<[string, null] | [null, string]> {
  try {
    logger.info('Updating recurring consultations for company id: ', id);
    await db.update(companies).set({ consultations: years }).where(eq(companies.id, id));
    return [null, 'successfully updated'];
  } catch (e) {
    console.error(e);
    logger.error(e);
    return [(e as DatabaseError).detail as string, null];
  }
}

export async function deleteCompany(id: string): Promise<string | null> {
  try {
    await db.delete(companies).where(eq(companies.id, id));
    return null;
  } catch (e) {
    return (e as DatabaseError).detail as string;
  }
}
