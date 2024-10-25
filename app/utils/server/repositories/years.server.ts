import { desc, eq } from 'drizzle-orm';
import { DatabaseError } from 'pg';

import { years } from '../schema.server';
import { db } from './db.server';

export async function getAllYears() {
  return db.select({ name: years.name, inflationRate: years.inflationRate }).from(years).orderBy(desc(years.name));
}

export async function deleteYear(name: number): Promise<string | null> {
  try {
    await db.delete(years).where(eq(years.name, name));
    return null;
  } catch (e) {
    return (e as DatabaseError).detail as string;
  }
}

export async function updateYear(name: number, inflationRate: number): Promise<string | null> {
  try {
    await db.update(years).set({ inflationRate }).where(eq(years.name, name));
    return null;
  } catch (e) {
    return (e as DatabaseError).detail as string;
  }
}

export async function createYear(name: number, inflationRate: number): Promise<string | null> {
  try {
    await db.insert(years).values({ name, inflationRate });
    return null;
  } catch (e) {
    return (e as DatabaseError).detail as string;
  }
}
