import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

const client = new pg.Client({
  user: process.env.DB_USER as string,
  password: process.env.DB_PASSWORD as string,
  database: process.env.DB_NAME as string,
  host: process.env.DB_HOST as string,
  ssl: false,
});

export const db = drizzle(client, { logger: false, casing: 'snake_case' });

await client.connect();
