import { ilike } from 'drizzle-orm';
import { DatabaseError } from 'pg';

import { companies } from '../schema.server';
import { db } from './db.server';

export async function getCompanies(
  name?: string,
): Promise<[string | undefined, { id: string; name: string }[] | undefined]> {
  try {
    if (name) {
      // TODO maybe convert it to use pgvector to account for wrong spelling
      return [
        undefined,
        await db
          .select({ id: companies.id, name: companies.name })
          .from(companies)
          .where(ilike(companies.name, `%${name}%`)),
      ];
    } else {
      return [undefined, await db.select({ id: companies.id, name: companies.name }).from(companies)];
    }
  } catch (e) {
    return [(e as DatabaseError).detail, undefined];
  }
}
