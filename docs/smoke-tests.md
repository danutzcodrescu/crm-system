# Upgrade smoke baseline

## Run

Use Node **26.13.0** (`nvm install && nvm use`), pnpm 10.18.3, and a running Docker daemon. No real credentials or `.env.local` setup is needed.

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install --with-deps chromium
pnpm test:tooling
pnpm test:smoke
```

Each run **builds `Dockerfile.db`**, using its default `postgres:17` base (latest 17.x patch when pulled). It starts that custom image on a random port, executes the real `db/*.sql` migrations in filename order, then automatically executes **`e2e/seed.sql`** through `/docker-entrypoint-initdb.d/9999_seed.sql`. It launches the actual Express/Remix application on another free port. The app process and test database are removed at teardown, including failed runs; the built image/layers are cached locally. Existing Compose volumes and databases are not touched. Never run the legacy `db:seed` script for these tests: it imports private spreadsheets and deletes existing data.

Explicitly select the PostgreSQL 17 base without changing the development/production containers:

```sh
SMOKE_POSTGRES_IMAGE=postgres:17 pnpm test:smoke
```

The override changes only the Dockerfile's base image; it does **not** bypass the custom locale setup. A database scenario verifies `datcollate`, `datctype` and Swedish ordering (`Zulu`, `Åby`, `Älmhult`, `Örebro`).

CI runs type checks, the production build and the smoke suite on Node 26.13.0 / PostgreSQL 17 without repository secrets. This tests a **freshly initialized** database, not an existing data-volume update. Browser scenarios run in Vite middleware mode; building the production Docker image is a separate check, not a claim that browser tests run against that image. Production-only runtime/secrets and credentialed integrations still need deployment checks. See [the upgrade notes](runtime-upgrade.md).

## GitHub Actions

[`.github/workflows/playwright.yml`](../.github/workflows/playwright.yml) defines **CRM CI**, triggered by pull requests to `main`, pushes to `main`, or **Actions → CRM CI → Run workflow**. Superseded runs for the same PR/branch are cancelled.

Two independent Ubuntu 24.04 jobs run in parallel:

- **TypeScript, tooling and smoke tests:** installs the pnpm version from `package.json` and Node from `.nvmrc`, uses the frozen lockfile, runs both TypeScript checks and the Infisical/Vite optimizer regression, installs Chromium, and runs the complete Playwright suite against synthetic data in the custom PostgreSQL 17 image.
- **Production Docker image:** builds the application's `Dockerfile` for linux/amd64, including its production build/type checks, then verifies native Argon2 hash/verify and imports Google APIs/Infisical inside the image. It does not publish/deploy an image or start a credentialed application server.

No repository secrets, customer SQL backups, Compose database or external account setup are required. Browser reports and server/database logs are uploaded as `smoke-test-results`; Docker logs are uploaded as `docker-build-logs`. Artifacts are retained for 14 days, including failed runs. Lint is not included while the known findings in [the upgrade notes](runtime-upgrade.md#lint-follow-up) remain unresolved.

## Coverage

- Inventory guard compares scenarios against every route registration in `vite.config.ts`; adding a route without a scenario fails the suite.
- All 14 authenticated pages: dashboard, initial consultation, agreement, recurring consultation, reporting, general information, compensation, invoicing, municipalities list/detail, logs, statuses, years, process. Assertions cover real rendered headings/data, tables where applicable, browser errors, server errors, and a hydrated menu interaction.
- Signin, signup, logout, reload/session persistence, invalid credentials, password mismatch, and unknown-route 404; Express `/health`.
- All API registrations, including dynamic company/contact/log/attachment URLs, authenticated response contracts and anonymous access checks. Direct Remix `_data` loader/action requests are tested, not just full-page redirects: parent-layout authentication cannot protect those by itself.
- Browser edits with database readback and reopen checks for consultation, agreement, reporting, general information, invoicing, statuses and years; recurring-consultation completion submission.
- Real multipart XLSX imports for all four import endpoints, plus invalid uploads, and SQL persistence checks.
- Contact/log CRUD, linked reminders, municipality update/delete and status create/delete. All destructive operations are confined to the disposable test database.
- Global search, table filtering/no-match/reset, default-year redirects and year selection, empty municipality sections, and a narrow-viewport rendering/menu pass for every authenticated page.

See [exploratory findings](smoke-exploration.md) for bugs discovered and remaining limitations.

The synthetic fixtures include Swedish names, old/new/unsigned agreements, assigned/unassigned users, multiple waves, dates, decimals, contacts, logs, reminders and current/prior/future years. They contain no customer data or Gmail refresh tokens. Serial sequences and the compensation materialized view are initialized too.

## External-service boundary

`pnpm test:tooling` separately exercises Vite's real development dependency optimizer against the actual Infisical server module, without loading `.env` files or mocking the SDK. It guards against browser-prebundling the Node-only SDK and verifies that Node can still import it. This covers a boundary that the fake-secret browser fixture below intentionally bypasses.

Only Infisical is replaced with fixed fake secrets, via a Vite resolver that requires both `NODE_ENV=test` and `CRM_SMOKE_TEST=1`. Authentication, password hashing, session cookies, Drizzle, SQL queries and application routes are real. The child server does not inherit developer database settings or Infisical credentials.

Gmail endpoints cover authentication and missing-parameter validation without a Google account. A successful OAuth exchange, mailbox reads, attachment download and email delivery are **not** covered. Municipality details exercise the application's unconnected-Gmail state. Do not put real Google tokens or credentials into this baseline.

## Explore interactively

```sh
pnpm smoke:serve
```

Open the printed URL in Polypane or another browser and sign in with `smoke_user` / `smoke-password`. This starts an independent seeded database; Ctrl+C removes it. Its logs are in `playwright/.cache/exploratory/`.

```sh
pnpm test:smoke:report
pnpm test:smoke:ui
```

Failures retain screenshots, traces and videos. Application/database logs are in `test-results/server.log` and `test-results/database.log`. CI uploads both `playwright-report/` and `test-results/` for each workflow run.
