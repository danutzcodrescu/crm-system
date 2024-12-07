import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './db',
  dialect: 'postgresql',
  schemaFilter: ['public', 'authentication'],
  schema: './app/utils/server/schema.server.ts',
  breakpoints: true,
  strict: true,
  verbose: true,
  dbCredentials: {
    database: 'test_db',
    host: 'localhost',
    port: 5432,
    user: 'admin',
    password: 'root',
    ssl: false,
  },
});
