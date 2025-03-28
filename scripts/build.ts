import { $ } from 'zx';

// Enable better error messages
$.verbose = true;

async function main() {
  try {
    // Read and parse package.json
    const version = await $`cat package.json | jq -r '.version'`;

    if (!version) {
      throw new Error('No version field found in package.json');
    }

    console.log(`📦 Building Docker image with version ${version}`);

    // Check if Dockerfile exists
    await $`test -f Dockerfile`;

    // Build the Docker image
    const imageName = `crm-system:${version}`.replace('\n', '');
    await $`docker build --build-arg SENTRY_DSN=${process.env.SENTRY_DSN} --build-arg SENTRY_ORG=${process.env.SENTRY_ORG} --build-arg SENTRY_PROJECT=${process.env.SENTRY_PROJECT} --build-arg SENTRY_AUTH_TOKEN=${process.env.SENTRY_AUTH_TOKEN} --no-cache --platform=linux/amd64 -t ${imageName} .`;
    // produce for local testing on silicon mac
    // await $`docker build --build-arg SENTRY_DSN=${process.env.SENTRY_DSN} --build-arg SENTRY_ORG=${process.env.SENTRY_ORG} --build-arg SENTRY_PROJECT=${process.env.SENTRY_PROJECT} --build-arg SENTRY_AUTH_TOKEN=${process.env.SENTRY_AUTH_TOKEN} --no-cache -t ${imageName} .`;

    // Optional: List the images
    await $`docker images | grep crm-system`;

    console.log('tarring the docker image ');
    await $`docker save ${imageName} > latest.tar`;
    console.log('✅ docker image saved');

    console.log(`🚀 Sending docker image to remote host`);
    await $`scp latest.tar ${process.env.REMOTE_USER}@${process.env.REMOTE}:${process.env.REMOTE_PATH}/docker.tar`;
    console.log('✅ docker image sent to remote host');

    console.log('🧼 Removing local docker image ');
    await $`rm latest.tar`;
    console.log('✅ docker image removed');

    console.log('🧼 Removing local docker images ');
    await $`docker image prune -a -f`;
    console.log('✅ docker images removed');

    await $`ssh ${process.env.REMOTE_USER}@${process.env.REMOTE} << 'EOF'
cd crm
docker-compose down webapp
docker rmi $(docker images --format "{{.ID}}" --filter "reference=crm-system*")
docker load -i docker.tar
sed -i 's/image: crm-system:[0-9]\+\.[0-9]\+\.[0-9]\+/image: ${imageName}/g' docker-compose.yml
docker-compose up -d webapp
rm -f docker.tar
EOF`;

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main();
