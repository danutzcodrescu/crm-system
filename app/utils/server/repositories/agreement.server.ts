import { asc, count, eq, isNotNull, or, sql } from 'drizzle-orm';

import { logger } from '../logger.server';
import { agreement, companies, compensationView } from '../schema.server';
import { db } from './db.server';

export interface AgreementData {
  id: string;
  companyId: string;
  typeOfAgreement: string;
  companyName: string;
  oldAgreementSent: boolean;
  isOldAgreementSigned: boolean;
  isOldAgreementShared: boolean;
  isNewAgreementSigned: boolean;
  isNewAgreementShared: boolean;
  oldAgreementSigned?: Date | null;
  oldAgreementShared?: Date | null;
  oldAgreementLink: string;
  oldAgreementAppendix: string;
  newAgreementSent: boolean;
  newAgreementSigned?: Date | null;
  newAgreementShared?: Date | null;
  newAgreementDateSent?: Date | null;
  newAgreementLink: string;
  inAgreement: boolean;
  firstTimeAnyAgreement: Date | null;
}

export async function getAgreementData(): Promise<[null, AgreementData[]] | [string, null]> {
  try {
    logger.info('Getting initial consultation data');
    const data = await db
      .select({
        id: agreement.id,
        companyName: companies.name,
        companyId: agreement.companyId,
        typeOfAgreement: agreement.typeOfAgreement,
        inAgreement: sql<boolean>`CASE WHEN ${agreement.oldAgreementDateSigned} IS NOT NULL OR ${agreement.newAgreementDateSigned} IS NOT NULL THEN TRUE ELSE FALSE END`,
        isOldAgreementSigned: sql<boolean>`CASE WHEN ${agreement.oldAgreementDateSigned} IS NOT NULL THEN TRUE ELSE FALSE END`,
        firstTimeAnyAgreement: sql<Date>`CASE WHEN ${agreement.oldAgreementDateSigned} IS NOT NULL OR ${agreement.newAgreementDateSigned} IS NOT NULL THEN LEAST(${agreement.oldAgreementDateSigned}, ${agreement.newAgreementDateSigned}) ELSE NULL END`,
        isOldAgreementShared: sql<boolean>`CASE WHEN ${agreement.oldAgreementDateShared} IS NOT NULL THEN TRUE ELSE FALSE END`,
        isNewAgreementSigned: sql<boolean>`CASE WHEN ${agreement.newAgreementDateSigned} IS NOT NULL THEN TRUE ELSE FALSE END`,
        isNewAgreementShared: sql<boolean>`CASE WHEN ${agreement.newAgreementDateShared} IS NOT NULL THEN TRUE ELSE FALSE END`,
        oldAgreementSent: agreement.oldAgreementSent,
        oldAgreementSigned: agreement.oldAgreementDateSigned,
        oldAgreementShared: agreement.oldAgreementDateShared,
        oldAgreementLink: agreement.oldAgreementLinkToAgreement,
        oldAgreementAppendix: agreement.oldAgreementLinkToAppendix,
        newAgreementSent: sql<boolean>`CASE WHEN ${agreement.newAgreementDateSent} IS NOT NULL THEN TRUE ELSE FALSE END`,
        newAgreementSigned: agreement.newAgreementDateSigned,
        newAgreementShared: agreement.newAgreementDateShared,
        newAgreementLink: agreement.newAgreementLinkToAgreement,
        newAgreementDateSent: agreement.newAgreementDateSent,
      })
      .from(agreement)
      .leftJoin(companies, eq(agreement.companyId, companies.id))
      .orderBy(asc(companies.name));
    logger.info('Initial consultation data fetched');
    return [null, data as AgreementData[]];
  } catch (e) {
    logger.error(e);
    return ['could not fetch initial consultation data', null];
  }
}

interface EditAgreementRecordArgs {
  id: string;
  oldAgreementDateSigned: string | null;
  oldAgreementDateShared: string | null;
  oldAgreementLinkToAgreement: string | null;
  oldAgreementLinkToAppendix: string | null;
  oldAgreementSent: boolean | null;
  newAgreementDateSigned: string | null;
  newAgreementDateShared: string | null;
  newAgreementLinkToAgreement: string | null;
  newAgreementDateSent: string | null;
  typeOfAgreement: 'old' | 'new';
}

export async function editAgreementRecord(args: EditAgreementRecordArgs) {
  try {
    logger.info(`Trying to update agreement data for id: ${args.id}`);
    await db
      .update(agreement)
      .set({
        ...args,
        ...(args.typeOfAgreement === 'old'
          ? {
              oldAgreementDateShared: args.oldAgreementDateShared ? new Date(args.oldAgreementDateShared) : undefined,
              oldAgreementDateSigned: args.oldAgreementDateSigned ? new Date(args.oldAgreementDateSigned) : undefined,
            }
          : {
              newAgreementDateShared: args.newAgreementDateShared ? new Date(args.newAgreementDateShared) : undefined,
              newAgreementDateSigned: args.newAgreementDateSigned ? new Date(args.newAgreementDateSigned) : undefined,
              newAgreementDateSent: args.newAgreementDateSent ? new Date(args.newAgreementDateSent) : undefined,
            }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
      .where(eq(agreement.id, args.id));
    logger.info('Agreement data edited successfully');
    return [null, ''];
  } catch (e) {
    logger.error(e);
    return ['could not edit agreement data', null];
  }
}

interface GetInAgreementCount {
  inOldAgreement: number;
  inNewAgreement: number;
}

export async function getInAgreementCount(): Promise<[null, GetInAgreementCount[]] | [string, null]> {
  try {
    logger.info('Getting in agreement count');
    const data = await db
      .select({
        inOldAgreement: sql<number>`COUNT(${agreement.oldAgreementDateSigned}) FILTER (
    WHERE ${agreement.newAgreementDateSigned} IS NULL)::int`,
        inNewAgreement: count(agreement.newAgreementDateSigned),
      })
      .from(agreement)
      .where(or(isNotNull(agreement.oldAgreementDateSigned), isNotNull(agreement.newAgreementDateSigned)));
    logger.info('In agreement count fetched');
    return [null, data as GetInAgreementCount[]];
  } catch (e) {
    logger.error(e);
    return ['could not fetch in agreement count', null];
  }
}

export interface MunicipalityAgreementData {
  id: string;
  oldAgreementLink: string | null;
  oldAgreementAppendix: string | null;
  oldAgreementDateSigned: Date | null;
  oldAgreementShared: boolean;
  oldAgreementDateShared: Date | null;
  oldAgreementSent: boolean | null;
  newAgreementLink: string | null;
  newAgreementDateSigned: Date | null;
  newAgreementShared: boolean;
  newAgreementDateShared: Date | null;
  newAgreementDateSent: Date | null;
  typeOfAgreement: 'old' | 'new';
}

export async function getAgreementForMunicipality(
  municipalityId: string,
): Promise<[null, MunicipalityAgreementData] | [string, null]> {
  try {
    logger.info(`Getting agreement data for municipality: ${municipalityId}`);
    const data = await db
      .select({
        id: agreement.id,
        typeOfAgreement: agreement.typeOfAgreement,
        oldAgreementLink: agreement.oldAgreementLinkToAgreement,
        oldAgreementAppendix: agreement.oldAgreementLinkToAppendix,
        oldAgreementDateSigned: agreement.oldAgreementDateSigned,
        oldAgreementShared: sql<boolean>`CASE WHEN ${agreement.oldAgreementDateShared} IS NOT NULL THEN TRUE ELSE FALSE END`,
        oldAgreementSent: agreement.oldAgreementSent,
        oldAgreementDateShared: agreement.oldAgreementDateShared,
        newAgreementLink: agreement.newAgreementLinkToAgreement,
        newAgreementDateSigned: agreement.newAgreementDateSigned,
        newAgreementShared: sql<boolean>`CASE WHEN ${agreement.newAgreementDateShared} IS NOT NULL THEN TRUE ELSE FALSE END`,
        newAgreementDateSent: agreement.newAgreementDateSent,
        newAgreementDateShared: agreement.newAgreementDateShared,
      })
      .from(agreement)
      .where(eq(agreement.companyId, municipalityId))
      .limit(1);

    const result = data[0] || {
      id: '',
      oldAgreementLink: null,
      oldAgreementAppendix: null,
      oldAgreementDateSigned: null,
      oldAgreementShared: false,
      oldAgreementDateShared: null,
      oldAgreementSent: null,
      newAgreementLink: null,
      newAgreementDateSigned: null,
      newAgreementShared: false,
      newAgreementDateShared: null,
      newAgreementDateSent: null,
      typeOfAgreement: 'old' as const,
    };

    logger.info(`Agreement data fetched for municipality: ${municipalityId}`);
    await db.refreshMaterializedView(compensationView);
    return [null, result];
  } catch (error) {
    logger.error({ error, municipalityId }, 'Error fetching agreement data for municipality');
    return ['could not retrieve agreement data', null];
  }
}
