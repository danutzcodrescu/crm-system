import { createHash } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir, readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { GenericContainer, Network, type StartedTestContainer, Wait } from 'testcontainers';

// Run the same browser/SQL scenarios against an existing production image.
// Only the external Infisical SDK boundary is replaced, through a container-only
// Node loader. Neither the built application nor its production image is edited.
export async function setupDockerSmoke(image: string) {
  const logDirectory = process.env.SMOKE_LOG_DIR || 'playwright/.cache/docker-smoke';
  await mkdir(logDirectory, { recursive: true });
  const databaseLog = createWriteStream(resolve(logDirectory, 'database.log'));
  const serverLog = createWriteStream(resolve(logDirectory, 'server.log'));
  const network = await new Network().start();
  let database: StartedPostgreSqlContainer | undefined;
  let server: StartedTestContainer | undefined;

  const cleanup = async () => {
    try {
      await server?.stop();
    } finally {
      try {
        await database?.stop();
      } finally {
        await network.stop();
        serverLog.end();
        databaseLog.end();
      }
    }
  };

  try {
    const migrations = (await readdir('db')).filter((name) => name.endsWith('.sql')).sort();
    const dockerfile = await readFile('Dockerfile.db', 'utf8');
    const postgresImage = process.env.SMOKE_POSTGRES_IMAGE || dockerfile.match(/^ARG POSTGRES_IMAGE=(.+)$/m)?.[1];
    if (!postgresImage) throw new Error('Dockerfile.db must declare its default POSTGRES_IMAGE');
    const databaseImage = `crm-smoke-postgres:${createHash('sha256')
      .update(dockerfile + postgresImage)
      .digest('hex')
      .slice(0, 16)}`;
    await GenericContainer.fromDockerfile(resolve('.'), 'Dockerfile.db')
      .withBuildArgs({ POSTGRES_IMAGE: postgresImage })
      .withCache(true)
      .build(databaseImage, { deleteOnExit: false });

    database = await new PostgreSqlContainer(databaseImage)
      .withNetwork(network)
      .withNetworkAliases('database')
      .withDatabase('crm_smoke')
      .withUsername('smoke')
      .withPassword('smoke')
      .withEnvironment({ TZ: 'UTC' })
      .withLogConsumer((stream) => stream.pipe(databaseLog, { end: false }))
      .withCopyFilesToContainer([
        ...migrations.map((name) => ({ source: resolve('db', name), target: `/docker-entrypoint-initdb.d/${name}` })),
        { source: resolve('e2e/seed.sql'), target: '/docker-entrypoint-initdb.d/9999_seed.sql' },
      ])
      .start();

    const application = new GenericContainer(image)
      .withNetwork(network)
      .withExposedPorts(4200)
      .withEnvironment({
        NODE_ENV: 'production',
        NODE_OPTIONS: '--import /smoke/docker-secrets-loader.mjs',
        TZ: 'UTC',
        PORT: '4200',
        DB_HOST: 'database',
        DB_PORT: '5432',
        DB_NAME: 'crm_smoke',
        DB_USER: 'smoke',
        DB_PASSWORD: 'smoke',
      })
      .withCopyFilesToContainer([
        { source: resolve('e2e/support/docker-secrets-loader.mjs'), target: '/smoke/docker-secrets-loader.mjs' },
        { source: resolve('e2e/support/docker-infisical.mjs'), target: '/smoke/docker-infisical.mjs' },
      ])
      .withLogConsumer((stream) => stream.pipe(serverLog, { end: false }))
      .withWaitStrategy(Wait.forHttp('/signin', 4200).forStatusCode(200))
      .withStartupTimeout(120_000);
    if (process.env.CRM_SMOKE_PLATFORM) application.withPlatform(process.env.CRM_SMOKE_PLATFORM);
    server = await application.start();

    const runtime = await server.exec(['node', '-p', 'JSON.stringify({node:process.versions.node,arch:process.arch})']);
    if (runtime.exitCode !== 0) throw new Error(`Could not inspect image runtime: ${runtime.output}`);
    const version = JSON.parse(runtime.output) as { node: string; arch: string };
    if (!version.node.startsWith('26.')) throw new Error(`Expected Node 26 image, got ${version.node}`);

    // Browsers and Playwright's API cookie jar treat loopback as trustworthy,
    // so the real production Secure cookie can be retained on this local URL.
    process.env.SMOKE_BASE_URL = `http://127.0.0.1:${server.getMappedPort(4200)}`;
    process.env.SMOKE_DATABASE_URL = database.getConnectionUri();
    console.log(`Docker smoke server: ${process.env.SMOKE_BASE_URL} (${image}; Node ${version.node}; ${version.arch})`);
    return cleanup;
  } catch (error) {
    await cleanup();
    throw error;
  }
}
