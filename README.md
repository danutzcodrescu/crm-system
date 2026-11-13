# CRM System

This is a CRM (Customer Relationship Management) system built with React Router 8 (Framework Mode), React 19, Express, and Drizzle ORM.

## Documentation

- [Application (`app/`) Documentation](docs/app.md)
- [Commands (`cmd/`) Documentation](docs/cmd.md)
- [Database (`db/`) Documentation](docs/db.md)
- [Upgrade smoke tests and isolated database](docs/smoke-tests.md)
- [React Router 8 migration and verification](docs/react-router-8-migration.md)
- [Previous React Router 7 migration](docs/react-router-migration.md)

## Development

Use Node **26.13.0** (`nvm install && nvm use`) and pnpm **10.18.3**.

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
- `build`: Runs `build:router` and `build-express`.
- `build:router`: Builds the React Router application using Vite.
- `build-express`: Compiles the Express server code and aliases paths.
- `dev`: Starts the development server using `tsx` and loads environment variables from `.env.local`.
- `lint`: Runs ESLint for code linting.
- `start`: Starts the compiled production server using Node.
- `start-local`: Starts the compiled production server using Node and loads environment variables from `.env.local`.
- `typecheck`: Runs type checking for both application and server code concurrently.
- `typecheck:app`: Generates React Router route types and checks the application with TypeScript.
- `typecheck:server`: Runs TypeScript type checking for the server code without emitting files.
- `db:push`: Pushes the database schema changes using Drizzle Kit and loads environment variables from `.env.local`.
- `db:generate`: Generates database migration files using Drizzle Kit and loads environment variables from `.env.local`.
- `db:migrate`: Applies database migration files using Drizzle Kit and loads environment variables from `.env.local`.
- `db:seed`: Runs the database seeding script using `tsx` and loads environment variables from `.env.local`.
- `db:replace`: Runs the script to replace names in the database using `tsx` and loads environment variables from `.env.local`.
- `db:consultation`: Runs the script to import initial consultation dates using `tsx` and loads environment variables from `.env.local`.
- `build-image`: Runs the build script for the Docker image using `tsx` and loads environment variables from `.env.production`.
