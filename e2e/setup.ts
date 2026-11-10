import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { once } from 'node:events';
import { createWriteStream } from 'node:fs';
import { mkdir, readdir, readFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { resolve } from 'node:path';
import { setTimeout } from 'node:timers/promises';

import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { GenericContainer } from 'testcontainers';

export default async function setup() {
  const logDirectory = process.env.SMOKE_LOG_DIR || 'test-results';
  await mkdir(logDirectory, { recursive: true });
  const migrations = (await readdir('db')).filter((name) => name.endsWith('.sql')).sort();
  const dockerfile = await readFile('Dockerfile.db', 'utf8');
  const postgresImage = process.env.SMOKE_POSTGRES_IMAGE || dockerfile.match(/^ARG POSTGRES_IMAGE=(.+)$/m)?.[1];
  if (!postgresImage) throw new Error('Dockerfile.db must declare its default POSTGRES_IMAGE');
  const imageTag = `crm-smoke-postgres:${createHash('sha256')
    .update(dockerfile + postgresImage)
    .digest('hex')
    .slice(0, 16)}`;
  await GenericContainer.fromDockerfile(resolve('.'), 'Dockerfile.db')
    .withBuildArgs({ POSTGRES_IMAGE: postgresImage })
    .withCache(true)
    .build(imageTag, { deleteOnExit: false });
  const databaseLog = createWriteStream(resolve(logDirectory, 'database.log'));
  const database = await new PostgreSqlContainer(imageTag)
    .withDatabase('crm_smoke')
    .withUsername('smoke')
    .withPassword('smoke')
    .withEnvironment({ TZ: 'UTC' })
    .withLogConsumer((stream) => stream.pipe(databaseLog, { end: false }))
    .withCopyFilesToContainer([
      ...migrations.map((name) => ({ source: resolve('db', name), target: `/docker-entrypoint-initdb.d/${name}` })),
      { source: resolve('e2e/seed.sql'), target: '/docker-entrypoint-initdb.d/9999_seed.sql' },
    ])
    .start()
    .catch((error) => {
      databaseLog.end();
      throw error;
    });

  let server: ReturnType<typeof spawn> | undefined;
  const log = createWriteStream(resolve(logDirectory, 'server.log'));
  const cleanup = async () => {
    if (server?.pid && server.exitCode === null && server.signalCode === null) {
      const exited = once(server, 'exit');
      server.kill('SIGTERM');
      const stopped = await Promise.race([exited.then(() => true), setTimeout(5000, false)]);
      if (!stopped) {
        server.kill('SIGKILL');
        await exited;
      }
    }
    log.end();
    await database.stop();
    databaseLog.end();
  };

  try {
    const listener = createServer();
    listener.listen(0, '127.0.0.1');
    await once(listener, 'listening');
    const address = listener.address();
    if (!address || typeof address === 'string') throw new Error('Could not allocate smoke server port');
    const port = address.port;
    const hmrListener = createServer();
    hmrListener.listen(0, '127.0.0.1');
    await once(hmrListener, 'listening');
    const hmrAddress = hmrListener.address();
    if (!hmrAddress || typeof hmrAddress === 'string') throw new Error('Could not allocate smoke HMR port');
    const hmrPort = hmrAddress.port;
    await new Promise<void>((done, reject) => hmrListener.close((error) => (error ? reject(error) : done())));
    await new Promise<void>((done, reject) => listener.close((error) => (error ? reject(error) : done())));
    process.env.SMOKE_BASE_URL = `http://127.0.0.1:${port}`;
    process.env.SMOKE_DATABASE_URL = database.getConnectionUri();

    // Deliberately do not inherit .env.local, Infisical credentials, or developer DB settings.
    server = spawn(process.execPath, ['--import', 'tsx', 'cmd/server.ts'], {
      env: {
        PATH: process.env.PATH,
        HOME: process.env.HOME,
        NODE_ENV: 'test',
        CRM_SMOKE_TEST: '1',
        CRM_SMOKE_HMR_PORT: String(hmrPort),
        TZ: 'UTC',
        PORT: String(port),
        DB_HOST: database.getHost(),
        DB_PORT: String(database.getPort()),
        DB_NAME: database.getDatabase(),
        DB_USER: database.getUsername(),
        DB_PASSWORD: database.getPassword(),
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    server.stdout?.pipe(log);
    server.stderr?.pipe(log);
    let spawnError: Error | undefined;
    server.on('error', (error) => {
      spawnError = error;
    });
    const deadline = Date.now() + 120_000;
    while (Date.now() < deadline) {
      if (spawnError) throw spawnError;
      if (server.exitCode !== null) throw new Error('Smoke server exited. See test-results/server.log');
      const response = await fetch(`${process.env.SMOKE_BASE_URL}/signin`, {
        signal: AbortSignal.timeout(30_000),
      }).catch(() => undefined);
      if (response?.ok) {
        console.log(
          `Smoke server: ${process.env.SMOKE_BASE_URL} (Dockerfile.db: ${postgresImage}; Node ${process.versions.node})`,
        );
        return cleanup;
      }
      await setTimeout(500);
    }
    throw new Error('Smoke server did not become ready. See test-results/server.log');
  } catch (error) {
    await cleanup();
    throw error;
  }
}
