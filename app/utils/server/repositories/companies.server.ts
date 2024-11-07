import { asc, eq, ilike, InferSelectModel } from 'drizzle-orm';
import { DatabaseError } from 'pg';

import { companies, status } from '../schema.server';
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

export type CompanyTable = Pick<InferSelectModel<typeof companies>, 'id' | 'name' | 'statusId'> & {
  statusName: string | null;
};

export async function getCompaniesTable(): Promise<[string | undefined, CompanyTable[] | undefined]> {
  try {
    return [
      undefined,
      await db
        .select({ id: companies.id, name: companies.name, statusId: companies.id, statusName: status.name })
        .from(companies)
        .leftJoin(status, eq(companies.statusId, status.id))
        .orderBy(asc(companies.name)),
    ];
  } catch (e) {
    return [(e as DatabaseError).detail, undefined];
  }
}

export async function deleteCompany(id: string): Promise<string | null> {
  try {
    await db.delete(companies).where(eq(companies.id, id));
    return null;
  } catch (e) {
    return (e as DatabaseError).detail as string;
  }
}

export async function createCompany({ name, statusId }: { name: string; statusId: string }) {
  try {
    await db.insert(companies).values({ name, statusId });
    return null;
  } catch (e) {
    return (e as DatabaseError).detail as string;
  }
}

export async function getCompany(id: string): Promise<[string | undefined, CompanyTable | undefined]> {
  try {
    const result = await db
      .select({ id: companies.id, name: companies.name, statusId: status.id, statusName: status.name })
      .from(companies)
      .leftJoin(status, eq(companies.statusId, status.id))
      .where(eq(companies.id, id));
    return [undefined, result[0]];
  } catch (e) {
    return [(e as DatabaseError).detail, undefined];
  }
}
