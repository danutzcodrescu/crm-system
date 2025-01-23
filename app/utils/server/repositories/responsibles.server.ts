import { logger } from '../logger.server';
import { responsibles } from '../schema.server';
import { db } from './db.server';

interface ResponsibleArgs {
  companyId: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  title?: string;
}

export async function createNewResponsible(args: ResponsibleArgs): Promise<[null, string] | [string, null]> {
  try {
    logger.info('Getting municipalities data');
    await db.insert(responsibles).values(args);
    return [null, 'Responsible created successfully'];
  } catch (e) {
    logger.error(e);
    return ['could not fetch municipalities data', null];
  }
}
