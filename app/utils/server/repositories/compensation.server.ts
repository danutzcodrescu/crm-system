import { and, asc, eq, gte, lte, sql, sum } from 'drizzle-orm';

import { logger } from '../logger.server';
import { agreement, compensationView } from '../schema.server';
import { db } from './db.server';

export interface CompensationData {
  id: string;
  companyName: string;
  typeOfAgreement: 'new' | 'old';
  inAgreement: boolean;
  inhabitants: number;
  variableCompensation: number;
  additionalCompensation: number;
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
        new: compensationView.totalCompensationNew,
        old: compensationView.totalCompensationOld,
        typeOfAgreement: compensationView.typeOfAgreement,
        year: compensationView.year,
      })
      .from(compensationView)
      .where(and(eq(compensationView.id, companyId), lte(compensationView.year, limitYear)));

    logger.info('Compensation data fetched');
    return [null, data as unknown as CompensationDataPerCompany[]];
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
    logger.info('Getting aggregated compensation per year');
    const data = await db
      .select({
        year: compensationView.year,
        totalCompensation: sum(compensationView.totalCompensation),
        eligible: sql<number>`SUM(CASE WHEN EXTRACT(YEAR FROM ${agreement.oldAgreementDateSigned}) <= (${compensationView.year} + 1) OR EXTRACT(YEAR FROM ${agreement.newAgreementDateSigned}) <= (${compensationView.year} + 1) THEN ${compensationView.totalCompensation} END)`,
      })
      .from(compensationView)
      .where(and(gte(compensationView.year, startYear), lte(compensationView.year, endYear)))
      .leftJoin(agreement, eq(agreement.companyId, compensationView.id))
      .groupBy(compensationView.year);
    logger.info('Aggregated compensation per year fetched');
    return [null, data as unknown as AggregatedCompensationPerYear[]];
  } catch (e) {
    logger.error(e);
    return ['could not fetch aggregated compensation per year', null];
  }
}
