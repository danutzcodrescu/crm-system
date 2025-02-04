import { and, asc, eq, lte } from 'drizzle-orm';

import { logger } from '../logger.server';
import { compensationView } from '../schema.server';
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
