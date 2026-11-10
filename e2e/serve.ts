import setup from './setup';

process.env.SMOKE_LOG_DIR = 'playwright/.cache/exploratory';
const cleanup = await setup();
console.log('Synthetic smoke login: smoke_user / smoke-password');
console.log('Press Ctrl+C to stop the server and remove its database container.');
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, async () => {
    await cleanup();
    process.exit(0);
  });
}
