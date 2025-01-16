import { and, asc, eq, sql } from 'drizzle-orm';

import { logger } from '../logger.server';
import { agreement, companies, reporting } from '../schema.server';
import { db } from './db.server';

export interface ReportingData {
  id: string;
  inAgreement: boolean;
  companyName: string;
  reportingDate: Date | null;
  haveReported: boolean | null;
  reportedBeforeDeadline: boolean | null;
  cigaretteButts: number | null;
  motivation: string | null;
  motivationForData: boolean | null;
  year: number;
}

export async function getAllReportingDataPerYear(year: number): Promise<[null, ReportingData[]] | [string, null]> {
  try {
    logger.info('Getting recurring consultation data');
    const data = await db
      .select({
        companyName: companies.name,
        id: companies.id,
        consultations: companies.consultations,
        year: reporting.year,
        inAgreement: sql`CASE WHEN (${agreement.oldAgreementDateSigned} is NOT NULL OR ${agreement.newAgreementDateSigned} is NOT NULL) AND (DATE_PART('year', ${agreement.newAgreementDateSigned}) <= ${year + 1} OR DATE_PART('year', ${agreement.oldAgreementDateSigned}) <= ${year + 1}) THEN TRUE ELSE FALSE END`,
        reportingDate: reporting.reportingDate,
        haveReported: sql`CASE WHEN (${agreement.oldAgreementDateSigned} is NOT NULL OR ${agreement.newAgreementDateSigned} is NOT NULL) AND ${reporting.reportingDate} IS NOT NULL THEN TRUE WHEN (${agreement.newAgreementDateSigned} is NOT NULL OR ${agreement.oldAgreementDateSigned} is NOT NULL) AND ${reporting.reportingDate} IS NULL THEN FALSE ELSE NULL END`,
        reportedBeforeDeadline: sql`CASE WHEN ${reporting.reportingDate} IS NOT NULL AND ${reporting.reportingDate} <= TO_DATE(${year + 1}  || '-02-15', 'YYYY-MM-DD') THEN TRUE ELSE FALSE END`,
        cigaretteButts: reporting.cigaretteButts,
        motivation: reporting.motivation,
        motivationForData: reporting.motivationForData,
      })
      .from(reporting)
      .leftJoin(companies, eq(reporting.companyId, companies.id))
      .leftJoin(agreement, eq(reporting.companyId, agreement.companyId))
      .where(eq(reporting.year, year))
      .orderBy(asc(companies.name));
    logger.info('Reporting data fetched');
    return [null, data as ReportingData[]];
  } catch (e) {
    logger.error(e);
    return ['could not fetch reporting data', null];
  }
}

export async function editReportingRecord(
  args: typeof reporting.$inferInsert,
): Promise<[null, string] | [string, null]> {
  try {
    logger.info('Trying to update reporting data for id: ', args.companyId, ' and year: ', args.year);
    await db
      .update(reporting)
      .set({
        ...args,
        reportingDate: args.reportingDate ? new Date(args.reportingDate) : undefined,
      })
      .where(and(eq(reporting.companyId, args.companyId as string), eq(reporting.year, args.year as number)));
    logger.info('Reporting data edited');
    return [null, ''];
  } catch (e) {
    logger.error(e);
    return ['could not edit reporting data', null];
  }
}
