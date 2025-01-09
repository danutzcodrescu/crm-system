import { UTCDate } from '@date-fns/utc';
import { asc, eq, sql } from 'drizzle-orm';

import { logger } from '../logger.server';
import { agreement, companies } from '../schema.server';
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
  newAgreementLink: string;
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
        isOldAgreementSigned: sql<boolean>`CASE WHEN ${agreement.oldAgreementDateSigned} IS NOT NULL THEN TRUE ELSE FALSE END`,
        isOldAgreementShared: sql<boolean>`CASE WHEN ${agreement.oldAgreementDateShared} IS NOT NULL THEN TRUE ELSE FALSE END`,
        isNewAgreementSigned: sql<boolean>`CASE WHEN ${agreement.newAgreementDateSigned} IS NOT NULL THEN TRUE ELSE FALSE END`,
        isNewAgreementShared: sql<boolean>`CASE WHEN ${agreement.newAgreementDateShared} IS NOT NULL THEN TRUE ELSE FALSE END`,
        oldAgreementSent: agreement.oldAgreementSent,
        oldAgreementSigned: agreement.oldAgreementDateSigned,
        oldAgreementShared: agreement.oldAgreementDateShared,
        oldAgreementLink: agreement.oldAgreementLinkToAgreement,
        oldAgreementAppendix: agreement.oldAgreementLinkToAppendix,
        newAgreementSent: agreement.newAgreementSent,
        newAgreementSigned: agreement.newAgreementDateSigned,
        newAgreementShared: agreement.newAgreementDateShared,
        newAgreementLink: agreement.newAgreementLinkToAgreement,
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
  newAgreementSent: boolean | null;
  typeOfAgreement: 'old' | 'new';
}

export async function editAgreementRecord(args: EditAgreementRecordArgs) {
  try {
    logger.info('Trying to update agreement data for id: ', args.id);
    await db
      .update(agreement)
      .set({
        ...args,
        oldAgreementDateShared: args.oldAgreementDateShared ? new UTCDate(args.oldAgreementDateShared) : undefined,
        oldAgreementDateSigned: args.oldAgreementDateSigned ? new UTCDate(args.oldAgreementDateSigned) : undefined,
        newAgreementDateShared: args.newAgreementDateShared ? new UTCDate(args.newAgreementDateShared) : undefined,
        newAgreementDateSigned: args.newAgreementDateSigned ? new UTCDate(args.newAgreementDateSigned) : undefined,
      })
      .where(eq(agreement.id, args.id));
    logger.info('Agreement data edited successfully');
    return [null, ''];
  } catch (e) {
    console.log(e);
    logger.error(e);
    return ['could not edit agreement data', null];
  }
}