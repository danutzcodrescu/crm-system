import { and, asc, eq, InferSelectModel, sql } from 'drizzle-orm';
import { DatabaseError } from 'pg';

import { logger } from '../logger.server';
import { agreement, companies, recurringConsultation } from '../schema.server';
import { db } from './db.server';

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

export interface ConsultationPerYear {
  id: string;
  name: string;
  meetingDate: Date | null;
}

export async function getCompaniesWithConsultationInYear(
  year: number,
): Promise<[string | null, ConsultationPerYear[] | null]> {
  try {
    return [
      null,
      await db
        .select({ id: companies.id, name: companies.name, meetingDate: recurringConsultation.meetingDate })
        .from(companies)
        .leftJoin(recurringConsultation, eq(recurringConsultation.companyId, companies.id))
        .leftJoin(agreement, eq(recurringConsultation.companyId, agreement.companyId))
        .where(
          and(
            sql`${agreement.newAgreementDateSigned} IS NULL`,
            sql`${companies.consultations} @> ARRAY[${year}::SMALLINT]`,
            eq(recurringConsultation.year, year),
          ),
        )
        .orderBy(asc(companies.name)),
    ];
  } catch (e) {
    logger.error(e);
    return [(e as DatabaseError).detail as string, null];
  }
}

type CompanyWithCode = Pick<InferSelectModel<typeof companies>, 'id' | 'code'>;

export async function getCompaniesWithCode(): Promise<[string | null, CompanyWithCode[] | null]> {
  try {
    return [null, await db.select({ id: companies.id, code: companies.code }).from(companies)];
  } catch (e) {
    logger.error(e);
    return [(e as DatabaseError).detail as string, null];
  }
}

export async function getCompanies() {
  try {
    const dt = await db
      .select({ id: companies.id, name: companies.name, code: companies.code })
      .from(companies)
      .orderBy(asc(companies.name));
    return [null, dt];
  } catch (e) {
    logger.error(e);
    return [(e as DatabaseError).detail as string, null];
  }
}
