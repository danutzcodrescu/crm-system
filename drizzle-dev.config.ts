import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './db',
  dialect: 'postgresql',
  schemaFilter: ['public', 'authentication'],
  schema: './app/utils/server/schema.server.ts',
  breakpoints: true,
  strict: true,
  verbose: true,
  casing: 'snake_case',
  dbCredentials: {
    database: process.env.DB_NAME as string,
    host: process.env.DB_HOST as string,
    port: 5432,
    user: process.env.DB_USER as string,
    password: process.env.DB_PASSWORD as string,
    ssl: false,
  },
});
