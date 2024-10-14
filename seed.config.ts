import { SeedPg } from '@snaplet/seed/adapter-pg';
import { defineConfig } from '@snaplet/seed/config';
import { Client } from 'pg';

export default defineConfig({
  adapter: async () => {
    const client = new Client({
      database: 'test_db',
      host: 'localhost',
      port: 5432,
      user: 'admin',
      password: 'root',
    });
    await client.connect();
    return new SeedPg(client);
  },
});
