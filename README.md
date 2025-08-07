# CRM System

This is a CRM (Customer Relationship Management) system built with Remix, Express, and Drizzle ORM.

## Documentation

- [Application (`app/`) Documentation](docs/app.md)
- [Commands (`cmd/`) Documentation](docs/cmd.md)
- [Database (`db/`) Documentation](docs/db.md)

## Development

Run the dev server:

```shellscript
pnpm dev
```

## Deployment

First, build your app for production:

```sh
pnpm build
```

Then run the app in production mode:

```sh
pnpm start
```

Now you'll need to pick a host to deploy it to.

## Scripts

The following scripts are available in `package.json`:

- `package`: Cleans the `dist` directory, runs type checking, and builds the application.
- `build`: Runs `build-remix` and `build-express`.
- `build-remix`: Builds the Remix application using Vite.
- `build-express`: Compiles the Express server code and aliases paths.
- `dev`: Starts the development server using `tsx` and loads environment variables from `.env.local`.
- `lint`: Runs ESLint for code linting.
- `start`: Starts the production server using Node with experimental specifier resolution.
- `start-local`: Starts the production server using Node with experimental specifier resolution and loads environment variables from `.env.local`.
- `typecheck`: Runs type checking for both Remix and server code concurrently.
- `typecheck-remix`: Runs TypeScript type checking for the Remix application.
- `typecheck:server`: Runs TypeScript type checking for the server code without emitting files.
- `db:push`: Pushes the database schema changes using Drizzle Kit and loads environment variables from `.env.local`.
- `db:generate`: Generates database migration files using Drizzle Kit and loads environment variables from `.env.local`.
- `db:migrate`: Applies database migration files using Drizzle Kit and loads environment variables from `.env.local`.
- `db:seed`: Runs the database seeding script using `tsx` and loads environment variables from `.env.local`.
- `db:replace`: Runs the script to replace names in the database using `tsx` and loads environment variables from `.env.local`.
- `db:consultation`: Runs the script to import initial consultation dates using `tsx` and loads environment variables from `.env.local`.
- `build-image`: Runs the build script for the Docker image using `tsx` and loads environment variables from `.env.production`.
