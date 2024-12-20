import { eq, sql } from 'drizzle-orm';

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
      .leftJoin(companies, eq(initialConsultation.companyId, companies.id));
    logger.info('Initial consultation data fetched');
    return [null, data as InitialConsultation[]];
  } catch (e) {
    logger.error(e);
    return ['could not fetch initial consultation data', null];
  }
}
