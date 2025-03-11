import { logger } from '../logger.server';
import { users } from '../schema.server';
import { db } from './db.server';
import { ne } from 'drizzle-orm';

export interface User {
  id: number;
  name: string;
}

export async function getAllUsers(): Promise<[string, null] | [null, User[]]> {
  try {
    logger.info('getAllUsers -> Fetching all users');
    const data = await db
      .select({ id: users.id, name: users.username })
      .from(users)
      .where(ne(users.username, 'admin_user'));
    return [null, data];
  } catch (e) {
    logger.error(e);
    return ['Could not retrieve users', null];
  }
}
