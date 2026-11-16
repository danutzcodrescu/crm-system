import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

const client = new pg.Client({
  user: process.env.DB_USER as string,
  password: process.env.DB_PASSWORD as string,
  database: process.env.DB_NAME as string,
  host: process.env.DB_HOST as string,
  port: Number(process.env.DB_PORT || 5432),
  ssl: false,
});

// SQL parameters can include passwords, session tokens and customer data.
export const db = drizzle(client, { logger: process.env.NODE_ENV !== 'production', casing: 'snake_case' });

await client.connect();
