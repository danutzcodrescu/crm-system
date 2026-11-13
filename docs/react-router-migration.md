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

## Next: React Router 8

V8 is already released, but adopting it is deliberately a separate step. Follow the [versioned v7 future-change guide](https://reactrouter.com/7.18.5/upgrading/future), rather than unversioned docs that now describe v8 → v9.

1. Upgrade React/React DOM and their types to **19.2.7 or newer**. Verify MUI, Emotion, PDF rendering, hydration and Sentry compatibility.
2. Use Node **22.22+** (the repository's declared Node 26 requirement exceeds this) and upgrade to **Vite 7+**.
3. Adopt and test the v8 flags incrementally: `v8_middleware`, `v8_splitRouteModules`, `v8_viteEnvironmentApi`, `v8_passThroughRequests`, and `v8_trailingSlashAwareDataRequests`. They are intentionally not enabled together with the Remix migration.
4. For the Vite Environment API, move the existing `isSsrBuild`-dependent build target into `environments.ssr.build` and verify the custom Express development server and Sentry source-map plugin.
5. Before enabling pass-through requests, review URL-dependent handlers, especially PDF generation and authentication. Use the normalized loader/action `url` for application routing instead of assuming `request.url` never contains `.data` or internal parameters.
6. Update `e2e/routes.ts` when enabling trailing-slash-aware requests (root changes from `/_root.data` to `/_.data`) and revalidate the isolated transport decoder against the installed router version.
7. Re-run type checks, builds, smoke tests, PDF/import checks and the security audit, then upgrade all React Router packages to matching v8 versions.

References: [Remix v2 migration](https://reactrouter.com/upgrading/remix), [v7 future changes](https://reactrouter.com/7.18.5/upgrading/future), [Sentry setup](https://docs.sentry.io/platforms/javascript/guides/react-router/manual-setup/).
