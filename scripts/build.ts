import { readFile } from 'node:fs/promises';

import { $ } from 'zx';

async function main() {
  // This script builds AND transfers the image. Tests stub all external commands.
  for (const key of ['SENTRY_AUTH_TOKEN', 'SENTRY_DSN', 'SENTRY_ORG', 'SENTRY_PROJECT', 'REMOTE_USER', 'REMOTE']) {
    if (!process.env[key]?.trim()) throw new Error(`${key} is required`);
  }
  const { version } = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  const revision = (await $`git rev-parse HEAD`.quiet()).stdout.trim();
  const release = process.env.SENTRY_RELEASE || `crm-system@${version}+${revision}`;
  const imageName = `crm-system:${version}`;

  console.log(`Building ${imageName}, Sentry release ${release}`);
  const buildArgs = [
    '--secret',
    'id=SENTRY_AUTH_TOKEN,env=SENTRY_AUTH_TOKEN',
    '--build-arg',
    'SENTRY_UPLOAD=true',
    '--build-arg',
    `SENTRY_DSN=${process.env.SENTRY_DSN}`,
    '--build-arg',
    `SENTRY_ORG=${process.env.SENTRY_ORG}`,
    '--build-arg',
    `SENTRY_PROJECT=${process.env.SENTRY_PROJECT}`,
    '--build-arg',
    `SENTRY_RELEASE=${release}`,
    '--build-arg',
    `SENTRY_ENVIRONMENT=${process.env.SENTRY_ENVIRONMENT || 'production'}`,
    '--no-cache',
    '--platform=linux/amd64',
    '-t',
    imageName,
  ];
  await $`docker build ${buildArgs} .`;

  const target = `${process.env.REMOTE_USER}@${process.env.REMOTE}`;
  console.log('Compressing and loading image on remote host');
  await $`docker save ${imageName} | gzip -1 | ssh ${target} 'docker load'`;
  console.log('Image loaded; restart the production service to deploy it.');
  // Do not prune unrelated local images as a side effect of building this one.
}

main().catch(() => {
  // Do not dump zx's process/env object: it may contain the build credential.
  console.error('Production image build/transfer failed; check the build output and required environment variables.');
  process.exitCode = 1;
});
