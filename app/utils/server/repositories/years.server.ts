import { asc, gte } from 'drizzle-orm';

import { logger } from '../logger.server';
import { years } from '../schema.server';
import { db } from './db.server';

export async function getAllYears(startYear = 2022): Promise<[string, null] | [null, number[]]> {
  try {
    const data = await db
      .select({ name: years.name })
      .from(years)
      .where(gte(years.name, startYear))
      .orderBy(asc(years.name));
    return [null, data.map((year) => year.name)];
  } catch (e) {
    logger.error(e);
    return ['could not fetch data about the years', null];
  }
}
