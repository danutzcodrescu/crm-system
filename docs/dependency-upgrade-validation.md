# Dependency upgrade and Oxlint validation

Validation date: 2026-11-13. This supplements the historical [React Router 8 report](react-router-8-migration.md).

The [production Sentry follow-up](production-sentry.md) on November 16 changes the
build/runtime configuration after the image results below. Its local tooling and
build checks are separate; Docker was stopped, so those new changes have not yet
been revalidated in production containers.

## Compatibility changes

The upgraded runtime versions are retained: Express 5.3.0, Vite 8.3.6, Zod 4.6.7,
React 19.3.1, React Router 8.5.1 and native TypeScript 7.0.2.

- Express 5 rejects the old `app.all('*', ...)` pattern at startup. The replacement
  `/{*splat}` includes `/` as well as nested routes.
- TypeScript 7 removes `baseUrl`. Both configs keep relative `paths` mappings and
  explicitly include Node types. `tsc-alias` still rewrites the compiled server's aliases.
- Vite 8 resolves TypeScript paths natively with `resolve.tsconfigPaths`; the old
  `vite-tsconfig-paths` plugin is removed. The config's JSON import uses import attributes.
- Vite ignores Playwright cache, trace and report directories. An initial full
  development run had 131 passes, six failures and three skips because generated
  trace HTML caused repeated page reloads during hydration. This watcher fix is
  covered by a configuration regression test.
- One redundant `fetcher?.data` access was simplified inside an already guarded
  email-rendering branch, resolving an additional Oxlint optional-chain diagnostic.
- A subsequent development run had 136 passes, one signup failure and three skips.
  Its trace showed a native document POST before hydration, returning a fresh form
  with empty credentials. A focused probe reproduced this; waiting for hydration
  changed the request to a fetch and preserved the same input nodes in five runs.
  The enhanced signup test now waits consistently with other hydrated UI tests
  and explicitly checks that validation retains the username/password draft.

## Lint policy

`pnpm lint` now runs Oxlint; `pnpm lint:fix` applies its available fixes. Review fixes
before committing. Formatting remains a separate Prettier concern.

Oxlint 1.92.0 is the lockfile version. Version 1.93.0 was too recent for this
repository's seven-day minimum release age at validation time.

The explicit `.oxlintrc.json` replaces both ESLint configs:

| Previous policy                  | Oxlint implementation                                                                           |
| -------------------------------- | ----------------------------------------------------------------------------------------------- |
| ESLint recommended               | Explicit native core rules; existing TypeScript/Prettier exemptions retained                    |
| TypeScript recommended           | Native `typescript/*` rules and core unused-variable checks                                     |
| Unused imports                   | Native `no-unused-vars`, including safe import fixes                                            |
| React recommended                | Native `react/*`; deprecated APIs via `react-legacy/no-deprecated`                              |
| Hook call order and dependencies | Native `react/rules-of-hooks` and `react/exhaustive-deps`                                       |
| React compiler recommended       | Upstream `eslint-plugin-react-hooks` via alias `react-hooks-js`, including config/gating checks |
| JSX accessibility                | Native `jsx-a11y/*`                                                                             |
| Import/export checks             | Native `import/*`, with automatic tsconfig discovery                                            |
| Import/export sorting            | `eslint-plugin-simple-import-sort` JS plugin                                                    |
| Drizzle bounded mutations        | Dependency-free local `tooling/oxlint-drizzle.mjs` JS plugin                                    |

Native React compiler checks alone missed several baseline findings, so they are
not used as a substitute for the upstream compiler checks. Rule implementations
are not universally identical between linters; representative behavioral canaries
and a baseline diagnostic comparison are used rather than claiming complete parity.
TypeScript catches strict-mode/type errors that do not have equivalent native
lint rules; React 19 no longer uses runtime PropTypes. No new type-aware lint layer
or `tsgolint` dependency was added. The nursery `import/named` rule is enabled, but
its module-resolution behavior did not flag a missing named export in a focused
probe; `tsc` remains the authoritative guard for missing exports and types.

The Drizzle plugin checks fluent `delete(...).where(...)` and
`update(...).set(...).where(...)` chains independently. It does not confuse hash
`.update()` calls with SQL updates or let a previous safe query hide a later unsafe
one. Like a syntax-only lint rule, it does not prove a predicate is restrictive,
track builders across statements, or validate dynamic SQL. The upstream Drizzle
plugin imported undeclared `@typescript-eslint/utils`, so retaining it would have
reintroduced the compatibility dependency this migration removes.

Oxlint's JS-plugin support is still alpha. The remaining React/sorting packages
are ESLint-format plugins executed by Oxlint, not a second ESLint lint pass. pnpm
still auto-installs ESLint transitively to satisfy their peers; `eslint-plugin-react`
declares a range excluding the installed ESLint 10 and emits a peer warning. There
is no direct ESLint CLI, `typescript-eslint`, TS 6 alias or native-compiler alias in
`package.json`. The behavioral canaries test that these plugins actually execute.

### Native replacements for the remaining JS plugins

The three remaining ESLint-format packages were checked against the native rules in
Oxlint 1.92.0 and the current 1.93.0 rule list (`oxlint --rules`). None can be removed
without losing an existing check:

| Package                            | Native Oxlint option                                                                                       | Decision |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------- | -------- |
| `eslint-plugin-react`              | No `react/no-deprecated`; only `typescript/no-deprecated`, which is JSDoc-driven and needs type-aware mode | Keep     |
| `eslint-plugin-react-hooks`        | `react/immutability`, `react/use-memo`, `react/set-state-in-effect`, `react/purity`, etc.                  | Keep     |
| `eslint-plugin-simple-import-sort` | Only `eslint/sort-imports`, which sorts by imported binding, not module path or import group               | Keep     |

A baseline comparison with the JS plugin removed and every native compiler rule
enabled produced 8 errors instead of the 9 current ones, but not the same errors:
native rules matched only the `immutability` finding, missed five `use-memo` and two
`set-state-in-effect` findings, and added six `purity` findings the plugin does not
report. That is a different rule set, not a replacement. `eslint/sort-imports` was
also probed with a deliberately unsorted file; it flagged import members by name but
did not enforce the module-path ordering `simple-import-sort` provides.

Repository lint still reports **nine existing errors and 20 warnings**:

- Effect-driven state updates in `EmailsCard`, `PageContainer` and `PaginatedTable`.
- Emotion cache mutation in `emotion-client`.
- Complex memo dependencies in compensation, general information, logs per period,
  recurring consultation and reporting.

These findings are preserved, not suppressed to manufacture a green lint result.
All 20 warnings are `import/no-named-as-default-member` notices on CommonJS packages
such as `pg` and `xlsx`; they match the previous ESLint warning count and are not new
regressions.

## Validation results

### Host tooling

- `pnpm install --frozen-lockfile` succeeds on the Node 24.22.1 host (the declared
  runtime is Node 26.13.0; pnpm only warns about the host engine).
- `pnpm typecheck` passes for both the application and Express server on TypeScript 7.0.2.
- `pnpm test:tooling` passes **25/25**: Oxlint policy canaries, React Router/Vite
  configuration, upload limits, TypeScript 7 toolchain and the Infisical optimizer guard.
- `pnpm build` succeeds.
- `pnpm db:generate` loads the TypeScript Drizzle config through the patched
  `esbuild` 0.25.10 and reports the expected 14-table schema with no changes.
- Formatting and `git diff --check` pass for all changed files.

### Development smoke suite

**137 passed, three production-only skips, zero failures** in 2.9 minutes against
Vite middleware mode, a freshly migrated PostgreSQL 17 database and synthetic data.
The suite was re-run after the dependency security updates and matches both the
pre-upgrade baseline and the earlier post-upgrade run.

### Production images

Both `linux/arm64` and `linux/amd64` images were rebuilt from the final source and
dependencies. Their standalone probes report Node 26.13.0, working Argon2
hashing/verification, all six native dependency imports, present compiled artifacts,
and no development dependencies or synthetic-secrets loader.

After the dependency security updates, the full production browser suite passed
**140/140 on each architecture** against the rebuilt images and disposable
PostgreSQL databases (2.2 minutes arm64, 2.1 minutes amd64), including the Docker-only
session-cookie, asset-cache and header checks. Both standalone runtime probes also
passed again. Build and test logs are under `playwright/.cache/audit-fixes/`.
The harness tears down its test containers and networks; a final independent
container inventory could not be checked on November 16 because Docker was stopped.

### Exploratory browser pass

Performed in Polypane (1384 px and 296 px panes) plus a scripted Playwright pass
against an isolated `pnpm smoke:serve` instance:

- Sign-in rejects a wrong password and accepts the synthetic account.
- Search selects a municipality and opens its detail page.
- The edit dialog discards an unsaved draft on Escape, reopens with persisted data
  and closes on Cancel without changing the record.
- The mobile stage menu navigates to Reporting; no console or page errors occurred.
- Dashboard and Reporting fit a 390 px viewport. The known 296 px overflow remains:
  the dashboard scrolls horizontally to 343 px, including the reminders action and
  reporting table.

Logs and screenshots are under `playwright/.cache/latest-deps-final/exploratory/`.

## Security and scope

Final `pnpm audit --prod`: **1 finding** (one high; no critical), down from 10.
Full audit on November 13: **21 unique advisories** (13 high, six moderate, two low;
no critical), down from 33. pnpm's summary counts **22 vulnerability instances**
(13 high, seven moderate, two low).

The remaining production finding is Zod `<4.6.6` through `@infisical/sdk`, which pins
`zod@^3.23.8`; the fix exists only in Zod 4.6.6+, so it needs an SDK update. Upgrading
the application's direct Zod to v4 does not update the SDK's separate dependency.

The other production findings were fixed without changing declared dependency ranges:

- `qs` 6.14.0 → 6.17.1 (transitive through `googleapis-common`; Express already had 6.17.1).
- `yaml` 1.10.2 → 1.10.3 through `cosmiconfig`/`babel-plugin-macros`.
- `@babel/runtime` 7.25.7 → 7.29.13 through Emotion's Babel plugin.
- `js-cookie` 3.0.5 → 3.0.8 (optional peer of `@react-hookz/web`). The cookie hook is
  not imported, so the package is no longer installed at all.
- `rollup` 4.52.4 → 4.68.0 (optional peer of `@sentry/bundler-plugins`, build-time only).
  Vite 8 does not require it, so it is no longer installed either.
- `esbuild` 0.18.20 → 0.25.10, pulled by the deprecated `@esbuild-kit/core-utils` used
  by `drizzle-kit`. That package only calls `transform`, `transformSync` and `version`,
  which are unchanged in 0.25. `pnpm db:generate` still loads the TypeScript config and
  reports the expected 14-table schema with no changes.

The three remaining `pnpm-workspace.yaml` overrides are narrow version selectors, not
broad package substitutions. `drizzle-kit` is already at its latest release and still
depends on `@esbuild-kit/esm-loader`, so an upstream fix is not available. The
remaining dev-only findings are in the `eslint-plugin-react` → `minimatch` →
`brace-expansion` chain, `testcontainers` → `archiver` → `glob`/`lodash`, and
`@react-router/dev` → `browserslist`/`baseline-browser-mapping`, and
`eslint-plugin-react-hooks` → `@babel/core`. These are audit
findings, not claims of demonstrated application exploitability.

Tests use synthetic credentials and disposable PostgreSQL databases only. They do
not validate real Infisical, Gmail OAuth/mail delivery or production Sentry delivery.
Nothing is deployed or published by this validation.
