import { UTCDate } from '@date-fns/utc';
import { and, asc, eq, sql } from 'drizzle-orm';

import { logger } from '../logger.server';
import { agreement, companies, initialConsultation, recurringConsultation } from '../schema.server';
import { db } from './db.server';

export interface RecurringConsultationPerMunicipality {
  id: string;
  companyName: string;
  consultations: number[];
  year: number;
  sentDate: Date | null;
  meetingDate: Date | null;
  consultationFormCompleted: boolean | null;
  meetingHeld: boolean | null;
  dateSharedWithAuthority: Date | null;
  agreementType: 'old' | 'new';
  recurringConsultation: boolean;
  initialConsultationSignedDate: Date | null;
  infoSharedWithAuthority: boolean;
}

export async function getRecurringConsultationData(
  year: number,
): Promise<[null, RecurringConsultationPerMunicipality[]] | [string, null]> {
  try {
    logger.info('Getting recurring consultation data');
    const data = await db
      .select({
        companyName: companies.name,
        id: companies.id,
        consultations: companies.consultations,
        year: recurringConsultation.year,
        sentDate: recurringConsultation.sentDate,
        meetingDate: recurringConsultation.meetingDate,
        consultationFormCompleted: recurringConsultation.consultationFormCompleted,
        meetingHeld: recurringConsultation.meetingHeld,
        infoSharedWithAuthority: sql`CASE WHEN ${recurringConsultation.dateSharedWithAuthority} IS NOT NULL THEN TRUE ELSE FALSE END`,
        dateSharedWithAuthority: recurringConsultation.dateSharedWithAuthority,
        agreementType: agreement.typeOfAgreement,
        recurringConsultation: sql<boolean>`CASE WHEN ${agreement.typeOfAgreement} = 'old' THEN TRUE ELSE FALSE END`,
        initialConsultationSignedDate: initialConsultation.dateSigned,
      })
      .from(recurringConsultation)
      .leftJoin(companies, eq(recurringConsultation.companyId, companies.id))
      .leftJoin(agreement, eq(recurringConsultation.companyId, agreement.companyId))
      .leftJoin(initialConsultation, eq(recurringConsultation.companyId, initialConsultation.companyId))
      .where(eq(recurringConsultation.year, year))
      .orderBy(asc(companies.name));
    logger.info('Recurring consultation data fetched');
    return [null, data as RecurringConsultationPerMunicipality[]];
  } catch (e) {
    logger.error(e);
    return ['could not fetch recurring consultation data', null];
  }
}

type EditRecurringConsultationArgs = typeof recurringConsultation.$inferInsert;

export async function editRecurringConsultationRecord(
  args: EditRecurringConsultationArgs,
): Promise<[string, null] | [null, string]> {
  try {
    logger.info('Trying to update recurring consultation data for id: ', args.companyId, ' and year: ', args.year);
    await db
      .update(recurringConsultation)
      .set({
        ...args,
        dateSharedWithAuthority: args.dateSharedWithAuthority ? new UTCDate(args.dateSharedWithAuthority) : undefined,
        sentDate: args.sentDate ? new UTCDate(args.sentDate) : undefined,
        meetingDate: args.meetingDate ? new UTCDate(args.meetingDate) : undefined,
      })
      .where(
        and(
          eq(recurringConsultation.companyId, args.companyId as string),
          eq(recurringConsultation.year, args.year as number),
        ),
      );
    logger.info('Recurring consultation data edited');
    return [null, ''];
  } catch (e) {
    console.log(e);
    logger.error(e);
    return ['could not edit recurring consultation data', null];
  }
}
