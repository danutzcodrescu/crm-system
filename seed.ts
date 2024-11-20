/**
 * Use any TypeScript runner to run this script, for example: `npx tsx seed.ts`
 * Learn more about the Seed Client by following our guide: https://docs.snaplet.dev/seed/getting-started
 */
import { copycat } from '@snaplet/copycat';
import { createSeedClient } from '@snaplet/seed';

const main = async () => {
  const seed = await createSeedClient();

  // Truncate all tables in the databaset
  await seed.$resetDatabase();

  // Seed the database with 10 years
  await seed.years((x) =>
    x(5, {
      inflation_rate: (ctx) => copycat.float(ctx.seed, { min: 0.3, max: 11.7 }),
      name: (ctx) => copycat.int(ctx.seed, { min: 2020, max: 2024 }),
    }),
  );
  const { statuses } = await seed.statuses((x) =>
    x(8, {
      name: (ctx) => copycat.words(ctx.seed, { min: 1, max: 3 }),
    }),
  );

  const { companies, employees } = await seed.companies(
    (x) =>
      x(300, {
        name: (ctx) => copycat.streetName(ctx.seed),
        code: (ctx) => copycat.unique(ctx.seed, (seed) => copycat.int(seed).toString(), new Set()),
        employees: (x) =>
          x(
            { min: 1, max: 10 },
            {
              name: (ctx) => copycat.fullName(ctx.seed),
              email: (ctx) => copycat.email(ctx.seed),
              phone_number: (ctx) => copycat.phoneNumber(ctx.seed),
              notes_log: (x) =>
                x(
                  { min: 0, max: 3 },
                  {
                    description: (ctx) => copycat.sentence(ctx.seed, { minWords: 15, maxWords: 500 }),
                  },
                ),
            },
          ),
      }),
    {
      connect: { statuses },
    },
  );

  await seed.reminders(
    (x) =>
      x(40, {
        date: (ctx) => copycat.dateString(ctx.seed, { minYear: 2024, maxYear: 2026 }),
        // @ts-expect-error enum type not supported yet
        type: (ctx) => copycat.oneOf(ctx.seed, ['reminder', 'meeting']),
        completed: false,
        description: (ctx) =>
          ctx.data.type === 'reminder'
            ? copycat.paragraph(ctx.seed, { minSentences: 1, maxSentences: 3 })
            : copycat.streetAddress(ctx.seed),
      }),
    { connect: { companies, employees } },
  );

  // Type completion not working? You might want to reload your TypeScript Server to pick up the changes

  console.log('Database seeded successfully!');

  process.exit();
};

main();
