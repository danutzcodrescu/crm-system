import { asc, eq, lte, sql } from 'drizzle-orm';

import { logger } from '../logger.server';
import { compensationView, years } from '../schema.server';
import { db } from './db.server';

export async function getAllYears(startYear = 2022, currentYear = true): Promise<[string, null] | [null, number[]]> {
  try {
    logger.info('Getting years data');
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

export interface FullYearData {
  name: number;
  changeFactor: number | null;
  changeFactorLitter: number | null;
}

export async function getYearsData(): Promise<[string, null] | [null, FullYearData[]]> {
  try {
    logger.info('Getting all years data');
    const data = await db
      .select({ name: years.name, changeFactor: years.changeFactor, changeFactorLitter: years.changeFactorLitter })
      .from(years)
      .where(lte(years.name, new Date().getFullYear()))
      .orderBy(asc(years.name));
    return [null, data];
  } catch (e) {
    logger.error(e);
    return ['could not fetch data about the years', null];
  }
}

interface UpdateYear {
  name: number;
  changeFactor: number;
  changeFactorLitter: number;
}

export async function updateYear(args: UpdateYear): Promise<string | null> {
  try {
    logger.info('Trying to update year: ', args.name);
    await db
      .update(years)
      .set({
        changeFactor: args.changeFactor,
        changeFactorLitter: args.changeFactorLitter,
      })
      .where(eq(years.name, args.name));
    await db.refreshMaterializedView(compensationView);
    return null;
  } catch (e) {
    logger.error(e);
    return 'could not update the year';
  }
}
