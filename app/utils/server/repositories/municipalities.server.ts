import { asc, eq, sql } from 'drizzle-orm';

import { logger } from '../logger.server';
import { companies, responsibles, status } from '../schema.server';
import { db } from './db.server';

export interface MunicipalityData {
  id: string;
  name: string;
  code: string;
  statusId: number;
  statusName: string;
  email: string;
  responsibles: Responsible[];
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
        responsibles: sql<
          Responsible[]
        >`JSON_AGG(JSON_BUILD_OBJECT('name', responsibles.name, 'email', responsibles.email, 'phone', responsibles.phone_number, 'title', responsibles.title, 'id', responsibles.id))`,
      })
      .from(companies)
      .leftJoin(status, eq(companies.statusId, status.id))
      .leftJoin(responsibles, eq(companies.id, responsibles.companyId))
      .groupBy(companies.id, status.name)
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
      })) as MunicipalityData[],
    ];
  } catch (e) {
    logger.error(e);
    return ['could not fetch municipalities data', null];
  }
}

interface UpdateMunicipalityArgs {
  companyId: string;
  email: string;
  statusId: number;
  code: string;
  name: string;
}

export async function updateMunicipality(args: UpdateMunicipalityArgs): Promise<[null, string] | [string, null]> {
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
