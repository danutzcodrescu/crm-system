import { and, asc, eq, gte, lte, sql, sum } from 'drizzle-orm';

import { logger } from '../logger.server';
import { agreement, compensationView, reporting, years } from '../schema.server';
import { db } from './db.server';

export interface CompensationData {
  id: string;
  companyName: string;
  typeOfAgreement: 'new' | 'old';
  inAgreement: boolean;
  inhabitants: number;
  variableCompensation: number;
  totalAddition: number;
  changeFactor: number;
  changeFactorLitter: number;
  totalCompensationOld: number;
  totalCompensationNew: number;
  totalCompensation: number;
}

export interface CompensationDataPerCompany {
  id: string;
  new: number;
  old: number;
  typeOfAgreement: 'new' | 'old';
  year: number;
}

export interface AggregatedCompensationPerYear {
  year: number;
  totalCompensation: number;
  eligible: number;
}

export async function getCompensationByYear(year: number): Promise<[null, CompensationData[]] | [string, null]> {
  try {
    logger.info('Getting compensation data');
    const data = await db
      .select()
      .from(compensationView)
      .where(eq(compensationView.year, year))
      .orderBy(asc(compensationView.companyName));

    logger.info('Compensation data fetched');
    return [null, data as unknown as CompensationData[]];
  } catch (e) {
    logger.error(e);
    return ['could not fetch compensation data', null];
  }
}

export async function getCompensationForCompany(
  companyId: string,
  limitYear: number,
): Promise<[null, CompensationDataPerCompany[]] | [string, null]> {
  try {
    logger.info('Getting compensation data for company:', companyId);
    const data = await db
      .select({
        id: compensationView.id,
        new: sql<number>`round(${compensationView.totalCompensationNew})`,
        old: sql<number>`round(${compensationView.totalCompensationOld})`,
        typeOfAgreement: compensationView.typeOfAgreement,
        year: compensationView.year,
      })
      .from(compensationView)
      .where(and(eq(compensationView.id, companyId), lte(compensationView.year, limitYear)))
      .orderBy(asc(compensationView.year));

    logger.info('Compensation data fetched');
    return [null, data as unknown as CompensationDataPerCompany[]];
  } catch (e) {
    logger.error(e);
    return ['could not fetch compensation data', null];
  }
}

export interface CompensationDataPerCompanyPerYear {
  id: string;
  year: number;
  companyName: string;
  total: number;
  variableCompensation: number;
  inhabitants: number;
  surcharge: number;
  changeFactor: number;
  changeFactorLitter: number;
  typeOfAgreement: 'new' | 'old';
  yearSekAdmin: number;
  adminFee: number;
}

export async function getCompensationForCompanyByYear(
  companyId: string,
  year: number,
): Promise<[null, CompensationDataPerCompanyPerYear] | [string, null]> {
  try {
    logger.debug('Getting compensation data for company:', companyId);

    return [
      null,
      (
        await db
          .select({
            id: compensationView.id,
            companyName: compensationView.companyName,
            yearSekAdmin: years.sekAdmin,
            year: compensationView.year,
            adminFee: years.adminFee,
            total: compensationView.totalCompensation,
            variableCompensation: compensationView.variableCompensation,
            inhabitants: compensationView.inhabitants,
            surcharge: compensationView.totalAddition,
            changeFactor: years.changeFactor,
            changeFactorLitter: years.changeFactorLitter,
            typeOfAgreement: compensationView.typeOfAgreement,
          })
          .from(compensationView)
          .leftJoin(years, eq(compensationView.year, years.name))
          .leftJoin(agreement, eq(compensationView.id, agreement.companyId))
          .where(and(eq(compensationView.id, companyId), eq(compensationView.year, year)))
          .limit(1)
      )[0] as CompensationDataPerCompanyPerYear,
    ];
  } catch (e) {
    logger.error(e);
    return ['could not fetch compensation data', null];
  }
}
export async function getAggregatedCompensationPerYear(
  startYear: number,
  endYear: number,
): Promise<[null, AggregatedCompensationPerYear[]] | [string, null]> {
  try {
    logger.debug('Getting aggregated compensation per year');
    const data = await db
      .select({
        year: compensationView.year,
        totalCompensation: sum(compensationView.totalCompensation),
        // TODO check if this is correct
        eligible: sql<number>`SUM(CASE WHEN ${compensationView.year} < EXTRACT(YEAR FROM ${agreement.oldAgreementDateSigned}) THEN ${compensationView.totalCompensation} WHEN ${compensationView.year} < EXTRACT(YEAR FROM ${agreement.newAgreementDateSigned}) THEN ${compensationView.totalCompensation} WHEN ${compensationView.year} >= EXTRACT(YEAR FROM ${agreement.newAgreementDateSigned}) AND ${reporting.reportingDate} IS NOT NULL THEN ${compensationView.totalCompensation} WHEN ${compensationView.year} >= EXTRACT(YEAR FROM ${agreement.oldAgreementDateShared}) AND ${reporting.reportingDate} IS NOT NULL THEN ${compensationView.totalCompensation} ELSE 0 END)`,
      })
      .from(compensationView)
      .where(and(gte(compensationView.year, startYear), lte(compensationView.year, endYear)))
      .leftJoin(agreement, eq(agreement.companyId, compensationView.id))
      .leftJoin(reporting, and(eq(compensationView.id, reporting.companyId), eq(compensationView.year, reporting.year)))
      .groupBy(compensationView.year);
    logger.debug('Aggregated compensation per year fetched');
    return [null, data as unknown as AggregatedCompensationPerYear[]];
  } catch (e) {
    logger.error(e);
    return ['could not fetch aggregated compensation per year', null];
  }
}
