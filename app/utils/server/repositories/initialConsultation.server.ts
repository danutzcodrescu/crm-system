import { asc, count, eq, isNotNull, sql } from 'drizzle-orm';

import { logger } from '../logger.server';
import { agreement, companies, initialConsultation } from '../schema.server';
import { db } from './db.server';

export interface InitialConsultation {
  id: string;
  companyId: string;
  companyName: string;
  documentSent: boolean;
  dateSent: Date | null;
  dateSigned?: Date | null;
  dateShared?: Date | null;
  link: string;
  isSigned: boolean;
  isShared: boolean;
}

export async function getInitialConsultationData(): Promise<[null, InitialConsultation[]] | [string, null]> {
  try {
    logger.info('Getting initial consultation data');
    const data = await db
      .select({
        id: initialConsultation.id,
        companyId: initialConsultation.companyId,
        companyName: companies.name,
        dateSent: initialConsultation.documentDateSent,
        documentSent: sql<boolean>`CASE WHEN ${initialConsultation.documentDateSent} IS NOT NULL OR ${agreement.oldAgreementDateSigned} IS NOT NULL THEN TRUE ELSE FALSE END`,
        dateSigned: initialConsultation.dateSigned,
        dateShared: initialConsultation.dateShared,
        link: initialConsultation.link,
        isSigned: sql<boolean>`CASE WHEN ${initialConsultation.dateSigned} IS NOT NULL THEN TRUE ELSE FALSE END`,
        isShared: sql<boolean>`CASE WHEN ${initialConsultation.dateShared} IS NOT NULL THEN TRUE ELSE FALSE END`,
      })
      .from(initialConsultation)
      .leftJoin(companies, eq(initialConsultation.companyId, companies.id))
      .leftJoin(agreement, eq(initialConsultation.companyId, agreement.companyId))
      .orderBy(asc(companies.name));
    logger.info('Initial consultation data fetched');
    return [null, data as InitialConsultation[]];
  } catch (e) {
    logger.error(e);
    return ['could not fetch initial consultation data', null];
  }
}

interface EditInitialConsultationArgs {
  id: string;
  dateSigned: Date | null;
  dateShared: Date | null;
  link: string | null;
  documentDateSent: Date | null;
}

export async function editInitialConsultationRecord(args: EditInitialConsultationArgs) {
  try {
    logger.info('Trying to update initial consultation data for id: ', args.id);
    await db
      .update(initialConsultation)
      .set({
        ...args,
        dateSigned: args.dateSigned ? new Date(args.dateSigned) : null,
        dateShared: args.dateShared ? new Date(args.dateShared) : null,
        documentDateSent: args.documentDateSent ? new Date(args.documentDateSent) : null,
      })
      .where(eq(initialConsultation.id, args.id));
    logger.info('Initial consultation data edited');
    return [null, ''];
  } catch (e) {
    logger.error(e);
    return ['could not edit initial consultation data', null];
  }
}

export interface InitialConsultationSigned {
  initialConsultationSigned: number;
}

export async function getSignedInitialConsultation(): Promise<[null, InitialConsultationSigned[]] | [string, null]> {
  try {
    logger.info('Getting signed initial consultation data');
    const data = await db
      .select({ initialConsultationSigned: count(initialConsultation.id) })
      .from(initialConsultation)
      .where(isNotNull(initialConsultation.dateSigned));
    logger.info('Signed initial consultation data fetched');
    return [null, data as InitialConsultationSigned[]];
  } catch (e) {
    logger.error(e);
    return ['could not fetch signed initial consultation data', null];
  }
}

export interface InitialConsultationData {
  documentSent: Date | null;
  isSigned: boolean;
  dateSigned: Date | null;
  isShared: boolean;
  dateShared: Date | null;
  link: string | null;
}

export async function getInitialConsultationForMunicipality(
  municipalityId: string,
): Promise<[string | null, InitialConsultationData | null]> {
  try {
    logger.info('Getting initial consultation data for municipality:', municipalityId);
    const data = await db
      .select({
        documentSent: initialConsultation.documentDateSent,
        isSigned: sql<boolean>`CASE WHEN ${initialConsultation.dateSigned} IS NOT NULL THEN TRUE ELSE FALSE END`,
        dateSigned: initialConsultation.dateSigned,
        isShared: initialConsultation.dateShared,
        dateShared: initialConsultation.dateShared,
        link: initialConsultation.link,
        id: initialConsultation.id,
      })
      .from(initialConsultation)
      .where(eq(initialConsultation.companyId, municipalityId))
      .limit(1);

    const result = data[0] || {
      documentSent: false,
      isSigned: false,
      dateSigned: null,
      isShared: null,
      dateShared: null,
      link: null,
    };

    logger.info('Initial consultation data fetched for municipality:', municipalityId);
    return [
      null,
      {
        ...result,
        documentSent: result.documentSent ?? null,
        isSigned: result.isSigned ?? false,
        isShared: result.dateShared !== null,
        dateSigned: result.dateSigned ?? null,
        dateShared: result.dateShared ?? null,
      },
    ];
  } catch (error) {
    logger.error('Error fetching initial consultation data for municipality:', municipalityId, error);
    return ['could not retrieve initial consultation data', null];
  }
}
