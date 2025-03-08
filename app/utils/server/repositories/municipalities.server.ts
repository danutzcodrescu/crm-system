import { asc, eq, sql } from 'drizzle-orm';

import { logger } from '../logger.server';
import { companies, responsibles, status, users } from '../schema.server';
import { db } from './db.server';

export interface MunicipalityData {
  id: string;
  name: string;
  code: string;
  statusId: number;
  statusName: string;
  email: string;
  responsibles: Responsible[];
  consultations: number[];
  responsibleName?: string;
  responsibleId?: number;
}

type Responsible = { name: string; email: string; phoneNumber: string; title: string; id: string };

export async function getMunicipalitiesData(): Promise<[null, MunicipalityData[]] | [string, null]> {
  try {
    logger.info('Getting municipalities data');
    const data = await db
      .select({
        id: companies.id,
        name: companies.name,
        code: companies.code,
        statusId: companies.statusId,
        statusName: status.name,
        email: companies.email,
        consultations: companies.consultations,
        responsibleName: users.username,
        responsibleId: users.id,
        responsibles: sql<
          Responsible[]
        >`JSON_AGG(JSON_BUILD_OBJECT('name', responsibles.name, 'email', responsibles.email, 'phone', responsibles.phone_number, 'title', responsibles.title, 'id', responsibles.id))`,
      })
      .from(companies)
      .leftJoin(status, eq(companies.statusId, status.id))
      .leftJoin(responsibles, eq(companies.id, responsibles.companyId))
      .leftJoin(users, eq(companies.responsibleId, users.id))
      .groupBy(companies.id, status.name, users.username, users.id)
      .orderBy(asc(companies.name));
    logger.info('Municipalities data fetched');
    return [
      null,
      data.map((item) => ({
        id: item.id,
        name: item.name,
        code: item.code,
        statusId: item.statusId,
        statusName: item.statusName,
        email: item.email,
        responsibles: item.responsibles,
        consultations: item.consultations || [],
        responsibleId: item.responsibleId,
        responsibleName: item.responsibleName,
      })) as MunicipalityData[],
    ];
  } catch (e) {
    logger.error(e);
    return ['could not fetch municipalities data', null];
  }
}

export async function getMunicipalityData(companyId: string): Promise<[null, MunicipalityData] | [string, null]> {
  try {
    logger.info('Getting municipality data');
    const data = await db
      .select({
        id: companies.id,
        name: companies.name,
        code: companies.code,
        statusId: companies.statusId,
        statusName: status.name,
        email: companies.email,
        consultations: companies.consultations,
        responsibleName: users.username,
        responsibleId: users.id,
      })
      .from(companies)
      .leftJoin(status, eq(companies.statusId, status.id))
      .leftJoin(users, eq(companies.responsibleId, users.id))
      .where(eq(companies.id, companyId))
      .groupBy(companies.id, status.name, users.username, users.id);
    return [null, { ...data[0], consultations: data[0].consultations || [] } as MunicipalityData];
  } catch (e) {
    logger.error(e);
    return ['could not fetch municipality data', null];
  }
}

interface UpdateMunicipalityArgs {
  companyId: string;
  email: string;
  statusId: number;
  code: string;
  name: string;
  responsibleId?: number;
}

export async function updateMunicipality(args: UpdateMunicipalityArgs): Promise<[null, string] | [string, null]> {
  console.log('test', args.responsibleId);
  try {
    logger.info('Updating municipalities data');
    await db.update(companies).set(args).where(eq(companies.id, args.companyId));
    logger.info('Municipalities data updated');
    return [null, 'Municipalities data updated'];
  } catch (e) {
    logger.error(e);
    return ['could not update municipalities data', null];
  }
}
