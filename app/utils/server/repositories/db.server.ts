import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

const client = new pg.Client({ user: 'admin', password: 'root', database: 'test_db', ssl: false });

export const db = drizzle(client, { logger: true, casing: 'snake_case' });

await client.connect();
