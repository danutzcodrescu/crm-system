# React Router 7 migration

The application now uses **React Router 7.18.5, Framework Mode**, the documented successor to Remix v2. React 18 and Vite 6 are intentionally retained to separate the framework migration from the React/Vite upgrades.

## What changed

- Remix runtime/dev/testing packages are replaced by `react-router` and `@react-router/{dev,node,express}`. `remix-utils` already supports v7; the standalone `@remix-run/form-data-parser` is not the old Remix framework runtime.
- Routes move from `vite.config.ts` to native `app/routes.ts`, preserving URLs, route IDs and nesting. `react-router.config.ts` retains SSR and the `dist` output directory.
- `HydratedRouter`/`ServerRouter`, generated route types, the CLI and the Express virtual server build replace their Remix equivalents.
- Loaders/actions use `data` (aliased as `routeData` to avoid conflicts with query results). Single Fetch preserves `Date` values rather than converting them to JSON strings; the shared date formatter accepts both.
- Browser SSR collects a completed React stream before extracting Emotion critical CSS. Do not revert it to `renderToString`: that cannot complete Single Fetch's Suspense hydration boundaries.
- Spreadsheet imports use a shared bounded multipart parser, retain their worksheet/column mappings, and keep the existing 500 MB file allowance. One file, ten parts and a total request-size limit are also enforced. Parsing XLSX still requires buffering the workbook.
- The existing live PDF generation handler remains in `entry.server.tsx`, using the real database and `@react-pdf/renderer`. It is not a static download or a mocked renderer. Download headers now encode Swedish filenames with RFC 5987 `filename*`, alongside an ASCII fallback.
- Sentry uses `@sentry/react-router` 11.11.0, matching the existing SDK baseline, with startup preloading, client `onError`, server error handling and server route instrumentation. No credentials or reporting destination changed. Source-map uploading still uses the existing Vite plugin.

No database migration or deployment was performed. The seven-day dependency release-age policy is unchanged. Existing already-locked Sentry/minimatch versions needed temporary exclusions during lockfile resolution; those exclusions are not retained.

## Verification

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test:tooling
pnpm build
pnpm test:smoke
pnpm audit --prod
```

Smoke tests use an isolated seeded PostgreSQL database. They verify all pages, navigation, authentication, CRUD, four actual XLSX imports with SQL readback, and the live PDF generation route with its authentication guard. They do not verify credentialed Gmail/Infisical operations or production Sentry delivery. See [smoke tests](smoke-tests.md).

Host tooling checks ran on the available Node **24.22.1** runtime. Production Docker images were additionally built on **Node 26.13.0** for **Linux arm64 and amd64**, including type checks, production compilation and dependency pruning. The standalone runtime probe checks native Argon2 hashing/verification, dependency imports, compiled artifacts and pruning inside each image. The optional [Docker smoke mode](smoke-tests.md#production-image-on-node-26) exercises the compiled images with synthetic secrets and disposable databases. No credentialed deployment was started.

### Docker verification results (2026-11-10)

| Local image                       | Runtime                                      | Production build/type checks | Native/runtime probe | Production smoke tests |
| --------------------------------- | -------------------------------------------- | ---------------------------- | -------------------- | ---------------------- |
| `crm-system:router7-node26`       | Node 26.13.0, Linux arm64                    | Passed                       | Passed               | **123 passed**         |
| `crm-system:router7-node26-amd64` | Node 26.13.0, Linux amd64 (locally emulated) | Passed                       | Passed               | **123 passed**         |

Both suites tested the actual compiled production application, including live compensation PDF generation and Swedish filenames, all four XLSX imports with SQL persistence checks, login/signup/logout, anonymous access guards, all page layouts, hydrated controls, CRUD, Secure/HttpOnly cookies and immutable asset caching. The standalone probe used the real dependency imports without any synthetic SDK loader. The HTTP/browser suites replaced only Infisical's external SDK boundary; credentialed integrations and Sentry delivery remain outside coverage. Test databases, app containers and networks were removed automatically. The images were retained locally and were not published or deployed.

Lint still reports existing React hook/compiler findings; this migration does not disable those rules or refactor unrelated UI state. A production dependency audit is **not clean**: unrelated advisories remain (including Express's `proxy-addr`, Zod, Google API dependencies and Emotion's build-time dependencies). Treat their remediation as a separate dependency-hardening task; moving frameworks alone does not make the application vulnerability-free.

## React Router 8 future flags

All five stable v8 migration flags supported by React Router 7.18.5 are enabled in `react-router.config.ts`:

- `v8_middleware`: use the middleware-capable request context. The Express server has no custom `getLoadContext` or application context values to migrate.
- `v8_splitRouteModules`: automatically split eligible client route exports without requiring every route to be splittable.
- `v8_viteEnvironmentApi`: scope the ESNext server target to `environments.ssr.build`; the custom Express development server loads its virtual build through the SSR environment's module runner.
- `v8_passThroughRequests`: pass raw requests to handlers. Gmail's OAuth return path now uses the normalized loader `url`, not a raw pathname that could contain `.data`. Existing query-only URL reads remain valid; PDF generation runs on document requests in `entry.server.tsx`.
- `v8_trailingSlashAwareDataRequests`: use `/_.data` for root data requests and `/path/_.data` for trailing-slash paths. The smoke URL helper and dedicated authenticated/anonymous transport checks cover these formats.

The optional `unstable_optimizeDeps` and `unstable_previewServerPrerendering` flags remain disabled. They are experimental, not prerequisites for v8; this SSR application does not configure prerendering.

The Vite smoke server now uses `NODE_ENV=development` plus the explicit `CRM_SMOKE_TEST=1` synthetic-secrets guard. With the Environment API, `NODE_ENV=test` produced server critical CSS links that React Router's development-only client hydration did not expect, causing hydration recovery and lost form input. A repeated signin/signup document-request regression checks browser errors; the synthetic-secrets guard is separately tested to stay disabled in production and ordinary development.

### Future-flag verification (2026-11-13)

- App/server type checks and all **8 tooling tests** passed on the available Node 24.22.1 host. Changed TypeScript files passed ESLint with no errors; repository-wide lint retains **9 existing errors in untouched files**.
- The hydration regression failed on all three repeated runs before the smoke-environment correction and passed on all three afterward.
- The final standalone Vite development smoke run passed **132 tests**, with only the **3 production-only tests skipped**. Its PDF assertion checks the existing development `inline` behavior, while Docker mode checks production `attachment` behavior.
- Fresh local image `crm-system:router7-future-flags-node26` built successfully with **Node 26.13.0, Linux arm64**, including production compilation and type checks. Its standalone native/runtime probe passed without a synthetic SDK loader.
- The final full production-mode smoke suite passed **135/135 tests** against that image, covering authentication, hydration, CRUD/SQL persistence, all four XLSX imports, live PDF generation, v8 data URLs, session cookie security and immutable asset caching.

The image was retained locally, not published or deployed. Production-mode tests used disposable seeded PostgreSQL and synthetic secrets at the external Infisical boundary; credentialed Gmail/Infisical operations and Sentry delivery remain unverified.

Run development and production suites sequentially: generated Playwright trace HTML from a parallel production run can trigger Vite page reloads and interrupt development UI interactions.

## Next: React Router 8

V8 is already released, but adopting it is deliberately a separate step. Follow the [versioned v7 future-change guide](https://reactrouter.com/7.18.5/upgrading/future), rather than unversioned docs that now describe v8 → v9.

1. Upgrade React/React DOM and their types to **19.2.7 or newer**. Verify MUI, Emotion, PDF rendering, hydration and Sentry compatibility.
2. Use Node **22.22+** (the repository's declared Node 26 requirement exceeds this) and upgrade to **Vite 7+**.
3. Keep all five v8 flags enabled and retain the Environment API and normalized-URL adaptations above. Revalidate the custom Express server and Sentry source-map plugin after the Vite upgrade.
4. Re-run type checks, builds, smoke tests, PDF/import checks and the security audit, then upgrade all React Router packages to matching v8 versions. Revalidate the isolated transport decoder against the upgraded router version.

References: [Remix v2 migration](https://reactrouter.com/upgrading/remix), [v7 future changes](https://reactrouter.com/7.18.5/upgrading/future), [Sentry setup](https://docs.sentry.io/platforms/javascript/guides/react-router/manual-setup/).
