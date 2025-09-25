import { and, asc, count, eq, gt, lte, sql, sum } from 'drizzle-orm';

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
        motivationForData: sql`CASE WHEN ${reporting.motivation} IS NOT NULL THEN TRUE WHEN ${reporting.motivation} is NULL AND ${reporting.reportingDate} IS NOT NULL THEN FALSE ELSE NULL END`,
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
    logger.info(`Trying to update reporting data for id: ${args.companyId} and year: ${args.year}`);
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

export interface GroupedReportingPerYear {
  year: number;
  haveReported: number;
  haveMotivated: number;
  cigaretteButts: string | null;
  haveReportedBeforeDeadline: number;
}

export async function getGroupedReportingPerYear(
  startYear: number,
  endYear: number,
): Promise<[null, GroupedReportingPerYear[]] | [string, null]> {
  try {
    logger.info('Getting grouped reporting data');
    const data = await db
      .select({
        year: reporting.year,
        haveReported: count(reporting.reportingDate),
        haveMotivated: count(reporting.motivation),
        cigaretteButts: sum(reporting.cigaretteButts),
        haveReportedBeforeDeadline: sql<number>`count( CASE WHEN reporting_date <= TO_DATE(${reporting.year} || '-02-15', 'YYYY-MM-DD') THEN 1 END )`,
      })
      .from(reporting)
      .where(and(gt(reporting.year, startYear), lte(reporting.year, endYear)))
      .groupBy(reporting.year);
    logger.info('Grouped reporting data fetched');
    return [null, data];
  } catch (e) {
    logger.error(e);
    return ['could not fetch grouped reporting data', null];
  }
}

export async function getReportingForCompany(
  companyId: string,
  limitYear: number,
): Promise<[null, ReportingData[]] | [string, null]> {
  try {
    logger.info(`Getting reporting data for company: ${companyId}`);
    const data = await db
      .select({
        companyName: companies.name,
        id: companies.id,
        year: reporting.year,
        reportingDate: reporting.reportingDate,
        cigaretteButts: reporting.cigaretteButts,
        motivation: reporting.motivation,
      })
      .from(reporting)
      .leftJoin(companies, eq(reporting.companyId, companies.id))
      .where(and(eq(reporting.companyId, companyId), lte(reporting.year, limitYear)))
      .orderBy(asc(reporting.year));
    logger.info('Reporting data fetched for company');
    return [null, data as ReportingData[]];
  } catch (e) {
    logger.error(e);
    return ['could not fetch reporting data for company', null];
  }
}

export async function bulkImportReporting(values: (typeof reporting.$inferInsert)[]): Promise<string | null> {
  try {
    await db
      .insert(reporting)
      .values(values)
      .onConflictDoUpdate({
        target: [reporting.companyId, reporting.year],
        set: {
          reportingDate: sql.raw(`excluded.reporting_date`),
          cigaretteButts: sql.raw(`excluded.cigarette_butts`),
          motivation: sql.raw(`excluded.${reporting.motivation.name}`),
        },
      });
    return null;
  } catch (e) {
    logger.error(e);
    return 'could not import reporting data';
  }
}
