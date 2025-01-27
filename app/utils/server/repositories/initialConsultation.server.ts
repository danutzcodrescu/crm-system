import { asc, count, eq, isNotNull, sql } from 'drizzle-orm';

import { logger } from '../logger.server';
import { companies, initialConsultation } from '../schema.server';
import { db } from './db.server';

export interface InitialConsultation {
  id: string;
  companyId: string;
  companyName: string;
  documentSent: boolean;
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
        documentSent: initialConsultation.documentSent,
        dateSigned: initialConsultation.dateSigned,
        dateShared: initialConsultation.dateShared,
        link: initialConsultation.link,
        isSigned: sql<boolean>`CASE WHEN ${initialConsultation.dateSigned} IS NOT NULL THEN TRUE ELSE FALSE END`,
        isShared: sql<boolean>`CASE WHEN ${initialConsultation.dateShared} IS NOT NULL THEN TRUE ELSE FALSE END`,
      })
      .from(initialConsultation)
      .leftJoin(companies, eq(initialConsultation.companyId, companies.id))
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
  documentSent: boolean;
}

export async function editInitialConsultationRecord(args: EditInitialConsultationArgs) {
  try {
    logger.info('Trying to update initial consultation data for id: ', args.id);
    await db
      .update(initialConsultation)
      .set({
        ...args,
        dateSigned: args.dateSigned ? new Date(args.dateSigned) : undefined,
        dateShared: args.dateShared ? new Date(args.dateShared) : undefined,
        documentSent: !!args.documentSent,
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
