import { and, asc, eq, lte, sql } from 'drizzle-orm';

import { logger } from '../logger.server';
import { companies, compensationView, generalInformation } from '../schema.server';
import { db } from './db.server';

export interface GeneralInformationPerMunicipality {
  id: string;
  companyName: string;
  year: number;
  inhabitants?: number;
  cleaningCost?: number;
  landSurface?: number;
  cleaningCostsPerInhabitant?: number;
  cleanedKg?: number;
  kgPerInhabitant?: number;
  epaMeasurement?: boolean;
}

export async function getGeneralInformationData(
  year: number,
): Promise<[null, GeneralInformationPerMunicipality[]] | [string, null]> {
  try {
    logger.info('Getting general information data data');
    const data = await db
      .select({
        companyName: companies.name,
        id: companies.id,
        year: generalInformation.year,
        inhabitants: generalInformation.inhabitants,
        landSurface: generalInformation.landSurface,
        cleaningCost: generalInformation.cleaningCost,
        cleaningCostsPerInhabitant: sql`CASE WHEN ${generalInformation.cleaningCost} is NOT NULL AND ${generalInformation.inhabitants} is NOT NULL THEN  ROUND(${generalInformation.cleaningCost} * 1.0 / ${generalInformation.inhabitants}) ELSE NULL END`,
        cleanedKg: generalInformation.cleanedKg,
        kgPerInhabitant: sql`CASE WHEN ${generalInformation.inhabitants} is NOT NULL AND ${generalInformation.cleanedKg} is NOT NULL THEN ROUND(${generalInformation.cleanedKg} * 1.00 / ${generalInformation.inhabitants}, 10) ELSE NULL END`,
        epaMeasurement: generalInformation.epaLitterMeasurement,
      })
      .from(generalInformation)
      .leftJoin(companies, eq(generalInformation.companyId, companies.id))
      .where(eq(generalInformation.year, year))
      .orderBy(asc(companies.name));
    logger.info('General information data fetched');
    return [null, data as GeneralInformationPerMunicipality[]];
  } catch (e) {
    logger.error(e);
    return ['could not fetch general information data', null];
  }
}

export async function editGeneralInformationRecord(
  args: typeof generalInformation.$inferInsert,
): Promise<[null, string] | [string, null]> {
  try {
    logger.info('Trying to update general information for id: ', args.companyId, ' and year: ', args.year);
    await db
      .update(generalInformation)
      .set({
        ...args,
      })
      .where(
        and(
          eq(generalInformation.companyId, args.companyId as string),
          eq(generalInformation.year, args.year as number),
        ),
      );
    logger.info('General information data edited');
    await db.refreshMaterializedView(compensationView);
    return [null, ''];
  } catch (e) {
    logger.error(e);
    return ['could not edit general information data', null];
  }
}

export async function getGeneralInformationForCompany(
  companyId: string,
  limitYear: number,
): Promise<[null, GeneralInformationPerMunicipality[]] | [string, null]> {
  try {
    logger.info('Getting general information data for company:', companyId);
    const data = await db
      .select({
        companyName: companies.name,
        id: companies.id,
        year: generalInformation.year,
        inhabitants: generalInformation.inhabitants,
        landSurface: generalInformation.landSurface,
        cleaningCost: generalInformation.cleaningCost,
        cleaningCostsPerInhabitant: sql`CASE WHEN ${generalInformation.cleaningCost} is NOT NULL AND ${generalInformation.inhabitants} is NOT NULL THEN  ROUND(${generalInformation.cleaningCost} * 1.0 / ${generalInformation.inhabitants}) ELSE NULL END`,
        cleanedKg: generalInformation.cleanedKg,
        kgPerInhabitant: sql`CASE WHEN ${generalInformation.inhabitants} is NOT NULL AND ${generalInformation.cleanedKg} is NOT NULL THEN ROUND(${generalInformation.cleanedKg} * 1.00 / ${generalInformation.inhabitants}, 10) ELSE NULL END`,
        epaMeasurement: generalInformation.epaLitterMeasurement,
      })
      .from(generalInformation)
      .leftJoin(companies, eq(generalInformation.companyId, companies.id))
      .where(and(eq(generalInformation.companyId, companyId), lte(generalInformation.year, limitYear)))
      .orderBy(asc(generalInformation.year));
    logger.info('General information data fetched for company');
    return [null, data as GeneralInformationPerMunicipality[]];
  } catch (e) {
    logger.error(e);
    return ['could not fetch general information data for company', null];
  }
}
