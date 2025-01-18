import { sql } from 'drizzle-orm';

import { logger } from '../logger.server';
import { years } from '../schema.server';
import { db } from './db.server';

export async function getAllYears(startYear = 2022, currentYear = true): Promise<[string, null] | [null, number[]]> {
  try {
    const query = sql`SELECT name FROM years WHERE name >= ${startYear}`;
    if (currentYear) {
      query.append(sql` AND name <= ${new Date().getFullYear()}`);
    }
    query.append(sql` ORDER BY name ASC`);
    const data = await db.execute<typeof years.$inferSelect>(query);
    return [null, data.rows.map((year) => year.name)];
  } catch (e) {
    logger.error(e);
    return ['could not fetch data about the years', null];
  }
}
