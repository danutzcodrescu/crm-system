# Upgrade smoke baseline

## Run

Use Node **26.13.0** (`nvm install && nvm use`), pnpm 10.18.3, and a running Docker daemon. No real credentials or `.env.local` setup is needed.

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install --with-deps chromium
pnpm test:tooling
pnpm test:hydration
pnpm test:smoke
```

`pnpm test:hydration` is a database-free Chromium regression for the real
municipality UI with synthetic loader data. It compares UTC server rendering with
UTC, Swedish/Stockholm and Los Angeles browser contexts, checking recoverable
hydration errors and browser console/page errors. It can run while Docker is
stopped. See [the 0.15.2 investigation](production-0.15.2-validation.md).

Each run **builds `Dockerfile.db`**, using its default `postgres:17` base (latest 17.x patch when pulled). It starts that custom image on a random port, executes the real `db/*.sql` migrations in filename order, then automatically executes **`e2e/seed.sql`** through `/docker-entrypoint-initdb.d/9999_seed.sql`. It launches the actual Express/React Router application on another free port. The app process and test database are removed at teardown, including failed runs; the built image/layers are cached locally. Existing Compose volumes and databases are not touched. Never run the legacy `db:seed` script for these tests: it imports private spreadsheets and deletes existing data.

Explicitly select the PostgreSQL 17 base without changing the development/production containers:

```sh
SMOKE_POSTGRES_IMAGE=postgres:17 pnpm test:smoke
```

The override changes only the Dockerfile's base image; it does **not** bypass the custom locale setup. A database scenario verifies `datcollate`, `datctype` and Swedish ordering (`Zulu`, `Åby`, `Älmhult`, `Örebro`).

CI runs type checks, the production build and both development/production smoke suites on Node 26.13.0 / PostgreSQL 17 without repository secrets. This tests a **freshly initialized** database, not an existing data-volume update. Browser scenarios normally run in Vite middleware mode; the Docker mode below runs the same scenarios against an existing compiled production image. CI's Docker job also runs that mode against its freshly built image. Credentialed integrations still need deployment checks.

## Production image on Node 26

Build a local image from the Dockerfile, which pins Node 26.13.0 and pnpm 10.18.3:

```sh
docker build --tag crm-system:router8-node26 --progress=plain .
docker run --rm -i --entrypoint node crm-system:router8-node26 --input-type=module \
  < e2e/support/docker-runtime-probe.mjs
CRM_SMOKE_IMAGE=crm-system:router8-node26 pnpm test:smoke
```

The standalone runtime probe verifies Node 26, React Router 8, React 19, native Argon2 hashing/verification, real imports of Google APIs/Infisical/PDF/React Router/Sentry/XLSX, compiled artifacts, and the absence of development dependencies and test loaders. It runs without the secrets replacement.

`e2e/docker-setup.ts` then starts that image with its normal production command and verifies that its runtime is Node 26. It connects only to a new disposable PostgreSQL container on an isolated test network. It does not rebuild or replace the application's compiled bundles. The production image has development dependencies pruned, and tests exercise SSR, hydration, authentication, APIs, PDF generation and all four XLSX imports against that image.

The only external replacement is a Node loader copied into the **test container**, redirecting the Infisical SDK to synthetic secret values. Both loader files live in `e2e/support/`, which is excluded from production images. No developer environment files or real credentials are passed to the container, and production `Secure`/`HttpOnly` session cookies remain enabled. Browsers and Playwright allow Secure cookies on the trustworthy loopback URL used for these local tests.

Docker-only cases additionally verify session cookie attributes, fingerprinted asset caching and the absence of the Express identification header. These cases are skipped in the default Vite smoke run. App/database logs default to `playwright/.cache/docker-smoke/`; override with `SMOKE_LOG_DIR`. The test containers and network are removed at teardown; the image is retained locally. This does not test credentialed Infisical/Gmail connectivity or production Sentry delivery.

To match the deployment script's architecture, add `--platform linux/amd64` to the build, use a distinct image tag such as `crm-system:router8-node26-amd64`, and set `CRM_SMOKE_PLATFORM=linux/amd64` alongside `CRM_SMOKE_IMAGE` when running the suite. Add `--platform linux/amd64` to the standalone runtime probe's `docker run` too. On Apple Silicon this runs under Docker's amd64 emulation.

Production testing exposed two development-only selector assumptions, not application failures: MUI removes its icon `data-testid` attributes in production, and React Router emits the entry URL as a module-preload link instead of `script[src]`. The shared filtering test and production asset test now use selectors that work with the compiled UI, without altering the application bundle or weakening their assertions.

## GitHub Actions

[`.github/workflows/playwright.yml`](../.github/workflows/playwright.yml) defines **CRM CI**, triggered by pull requests to `main`, pushes to `main`, or **Actions → CRM CI → Run workflow**. Superseded runs for the same PR/branch are cancelled.

Two independent Ubuntu 24.04 jobs run in parallel:

- **TypeScript, tooling and smoke tests:** installs the pnpm version from `package.json` and Node from `.nvmrc`, uses the frozen lockfile, runs both TypeScript checks and the Infisical/Vite optimizer regression, installs Chromium, and runs the complete Playwright suite against synthetic data in the custom PostgreSQL 17 image.
- **Production Docker image:** builds the application's `Dockerfile` for linux/amd64, including its production build/type checks, runs the standalone runtime/native-dependency probe, then runs the full browser suite against the compiled image with an isolated database and synthetic secrets. It does not publish/deploy an image or start a credentialed application server.

No repository secrets, customer SQL backups, Compose database or external account setup are required. Development browser reports and server/database logs are uploaded as `smoke-test-results`; Docker logs and production browser artifacts are uploaded as `docker-build-logs`. Artifacts are retained for 14 days, including failed runs. Lint is not included while the known findings in [the current dependency/Oxlint report](dependency-upgrade-validation.md#lint-policy) remain unresolved.

## Coverage

- Inventory guard compares scenarios against every route registration in `app/routes.ts`; adding a route without a scenario fails the suite.
- All 14 authenticated pages: dashboard, initial consultation, agreement, recurring consultation, reporting, general information, compensation, invoicing, municipalities list/detail, logs, statuses, years, process. Assertions cover real rendered headings/data, tables where applicable, browser errors, server errors, and a hydrated menu interaction.
- Signin, signup, logout, reload/session persistence, invalid credentials, password mismatch, and unknown-route 404; Express `/health`.
- Bot-classified document requests (Googlebot) hydrate with the same theme, Emotion and localization providers as ordinary browser requests.
- React Router 8 metadata via `loaderData` on SSR/client navigation/back/forward, without document reloads; progressively enhanced login/logout with JavaScript disabled.
- All API registrations, including dynamic company/contact/log/attachment URLs, authenticated response contracts and anonymous access checks. Direct React Router `.data`/`_routes` loader/action requests are tested, not just full-page redirects: parent-layout authentication cannot protect those by itself. The v8 root `/_.data`, regular `/path.data` and trailing-slash `/path/_.data` formats have dedicated authenticated/anonymous checks. `e2e/route-data.ts` isolates decoding of the framework's internal transport.
- Browser edits with database readback and reopen checks for consultation, agreement, reporting, general information, invoicing, statuses and years; recurring-consultation completion submission.
- Dialog lifecycle regression checks: retain drafts after rejected actions, retry successfully, reopen with retained fetcher results, cancel without saving, and prevent an older pending save from closing a newly opened draft. Global creation uses the same success-only lifecycle.
- Real multipart XLSX imports for all four import endpoints, plus invalid uploads, and SQL persistence checks.
- The live compensation PDF resource route (`/municipalities/:municipalityId/:year.pdf`): PDF signature, end marker, download headers and anonymous-access guard, using real seeded compensation data and the actual renderer. A server-log assertion catches missing-route 404s even if an error fallback returns a valid PDF; unrelated PDF paths and invalid filenames must remain 404s.
- Contact/log CRUD, linked reminders, municipality update/delete and status create/delete. All destructive operations are confined to the disposable test database.
- Global search, table filtering/no-match/reset, default-year redirects and year selection, empty municipality sections, and a narrow-viewport rendering/menu pass for every authenticated page.
- Dashboard reminders: toggle recent/all, refresh on reopening, retain the selected recent view when an older request finishes, and automatically revalidate the full list after an action.

See [current dependency/Oxlint validation](dependency-upgrade-validation.md) for the latest results, and [React Router 8 verification and exploratory findings](react-router-8-migration.md) for the historical baseline.

The synthetic fixtures include Swedish names, old/new/unsigned agreements, assigned/unassigned users, multiple waves, dates, decimals, contacts, logs, reminders and current/prior/future years. They contain no customer data or Gmail refresh tokens. Serial sequences and the compensation materialized view are initialized too.

## External-service boundary

`pnpm test:tooling` separately exercises Vite's real development dependency optimizer against the actual Infisical server module, without loading `.env` files or mocking the SDK. It guards against browser-prebundling the Node-only SDK and verifies that Node can still import it. This covers a boundary that the fake-secret browser fixture below intentionally bypasses.

Only Infisical is replaced with fixed fake secrets, via a Vite resolver that requires both `NODE_ENV=development` and `CRM_SMOKE_TEST=1`. Development mode keeps React Router's server/client critical CSS hydration consistent with the Vite Environment API; `NODE_ENV=test` incorrectly disables the client half. Authentication, password hashing, session cookies, Drizzle, SQL queries and application routes are real. The child server does not inherit developer database settings or Infisical credentials.

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
