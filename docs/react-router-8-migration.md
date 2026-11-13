# React Router 8 migration

Upgraded on 2026-11-13 using the [official v7 → v8 guide](https://reactrouter.com/upgrading/v7).

## Versions and compatibility

| Dependency                                         | Before | After  |
| -------------------------------------------------- | ------ | ------ |
| `react-router`, `@react-router/{dev,node,express}` | 7.18.5 | 8.5.1  |
| `react`, `react-dom`                               | 18.3.1 | 19.3.1 |
| `@types/react`, `@types/react-dom`                 | 18.x   | 19.3.0 |
| `vite`                                             | 6.4.6  | 7.3.7  |
| `remix-utils`                                      | 8.8.0  | 10.0.1 |

The existing seven-day dependency release-age policy remains unchanged. The final install has no peer-dependency warnings. Sentry 11.11.0, MUI 9, Emotion 11 and React PDF 4 support the upgraded React/router dependencies and did not require unrelated upgrades.

The declared Node requirement remains **26.13.0**. The Docker base and pnpm installation now match `.nvmrc` and `packageManager`, rather than floating with `node:lts` and the latest pnpm. Local tooling/browser checks use the available **Node 24.22.1** host (above React Router's 22.22 minimum); production-image checks use Node 26.13.0.

## Application changes

- Removed the five v8 future flags: middleware, Vite environments, raw requests and trailing-slash-aware data URLs are now defaults. Route splitting is explicitly retained as top-level `splitRouteModules: true`.
- Replaced the municipality metadata function's removed `data` argument with `loaderData`. A regression checks the actual HTML title and client navigation/history without document reloads.
- Fixed an existing no-JavaScript logout failure discovered during exploratory coverage: the topbar now submits a native-compatible `POST`, and the authenticated logout endpoint accepts both `POST` and legacy `DELETE`. The same regression was reproduced against the pre-upgrade v7 production image before fixing it. React Router still supports `DELETE` with JavaScript; its [Form method documentation](https://reactrouter.com/api/components/Form#method) recommends `GET`/`POST` for progressive enhancement.
- Kept the existing custom Express Vite SSR environment runner, normalized loader `url` handling, route IDs, resource routes, Sentry instrumentation and source maps.
- Unified document rendering for bots and browsers. The old bot path omitted Emotion/theme/localization providers, producing React 19 hydration mismatches for Googlebot and default headless Chromium user agents. All documents now use the existing completed React stream plus critical-CSS extraction, with the same provider tree as the client. Both old render paths already waited for `onAllReady`; bots now also buffer the completed HTML for Emotion extraction. The unused direct `isbot` dependency is removed. An explicit Googlebot browser regression failed before this change and passes afterward.
- Upgraded `remix-utils` to its router-8-compatible major; the old major only supports router 7. Existing `ClientOnly` and honeypot usage is retained and exercised.
- Added configuration/version consistency checks and production runtime assertions for React Router 8 and React 19.
- Made dialog submission tracking concurrent-render-safe: `useSubmissionState` records mutations from the form's `onSubmit` event instead of depending on a committed intermediate `submitting` render. Fast successful requests could discard that render and leave dialogs open. The small `onSubmit` interface is wired through all shared edit-dialog callers and the add-item form; failed drafts, retained results and cancelled/reopened sessions retain their existing semantics.
- Initialized empty shared select fields with `''` instead of `undefined`. This removes the React uncontrolled-to-controlled error and MUI out-of-range warnings when choosing a municipality in global creation. The dialog regression checks console/page errors before its intentional HTTP validation failure.
- Extended the existing Docker CI job to run the standalone production runtime probe and full smoke suite against its newly compiled image, not only development-mode browser tests.

No database migration, real-data operation, publication or deployment is part of this upgrade. Browser tests use disposable seeded PostgreSQL and replace only the external Infisical secrets boundary. Authentication, hashing, SQL, route handlers, XLSX parsing and PDF rendering remain real.

## Verification results

- Frozen-lockfile installation, application/server TypeScript checks, all **9 tooling tests**, and the production build pass.
- Final development browser suite: **137 passed, 3 production-only checks skipped**, with retries disabled.
- Final compiled-production browser suites: **140/140 passed on arm64** and **140/140 passed on amd64**, using Node 26.13.0, with no skips or retries. Both exercised the normal production start command against disposable seeded PostgreSQL. Test containers/networks were removed; the existing Compose database was left running and unchanged.
- All **15 repeated reminders checks** (three scenarios, five independent repetitions) and **5 dialog rejection/retry/cancellation checks** pass after the submission-lifecycle correction.
- Production Docker builds and standalone runtime/native probes pass for **Node 26.13.0 on Linux arm64 and amd64**. The probes use real SDK imports without the synthetic secrets loader and verify Argon2 hash/verify, React/router versions, compiled artifacts and dependency pruning. Images are retained locally as `crm-system:router8-node26` and `crm-system:router8-node26-amd64`; neither is published.
- The changed shared hooks/forms, SSR, upgrade tests and configuration pass uncached ESLint; formatting checks and `git diff --check` pass. Repository-wide lint retains the existing findings below, including unchanged memo expressions in a few routes whose dialog wiring was updated.

Local HTML reports are retained under `playwright/.cache/router8-verification/{development,production-arm64,production-amd64}-report/`, with matching server/database log directories alongside them. For example:

```sh
pnpm exec playwright show-report playwright/.cache/router8-verification/production-amd64-report
```

## Reproduce verification

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test:tooling
pnpm build
pnpm test:smoke
docker build --tag crm-system:router8-node26 --progress=plain .
docker run --rm -i --entrypoint node crm-system:router8-node26 --input-type=module \
  < e2e/support/docker-runtime-probe.mjs
CRM_SMOKE_IMAGE=crm-system:router8-node26 pnpm test:smoke
pnpm exec eslint --no-cache .
pnpm audit --prod
```

Run development and production browser suites sequentially; Playwright's generated HTML can otherwise trigger Vite reloads during another suite. See [smoke tests](smoke-tests.md) for isolation, logs, CI and interactive exploration.

The browser inventory covers every registered route and endpoint, all 14 authenticated pages at desktop and 390 px, signin/signup/logout and anonymous guards, `.data`/root/trailing-slash transport, hydrated menus/search/filter/year selection, edit-dialog rejection/retry/race handling, CRUD with SQL readback, four real XLSX imports, and live compensation PDFs including Swedish filenames and missing-route log checks. Production mode additionally checks Secure/HttpOnly session cookies, immutable asset caching and Express header removal. The migration adds SSR/client/history metadata, no-JavaScript login/logout, legacy DELETE logout and bot-user-agent hydration regressions.

The no-JavaScript logout test failed on both the upgraded app and the retained v7 production image before the POST fix, then passed after it. The explicit Googlebot hydration test failed on the upgraded app before unifying renderers, then passed with no console/page errors. These checks remain in the suite; no retries or warning filters were added to make them pass.

One development run under concurrent image-build load exposed a reminders-test readiness race. The trace recorded its click at 42314 ms, before React's client module initialized at 42444 ms; no reminders API request was issued and the control remained in its initial state. The reminders and global-create JS-only interaction tests now wait for network-idle after document navigation, consistent with the existing smoke scenarios. Application behavior and assertions were not weakened, and retries remain disabled.

Repeating the reminders scenarios then exposed a separate actual dialog defect: successful log creation left the dialog open on all five isolated runs. Instrumentation showed `submitting` renders being started but never committed; the final render resumed from idle with no tracked mutation. Moving mutation tracking to the form event fixes this without disabling concurrent rendering or forcing synchronous router updates. Temporary debug instrumentation was removed.

## Exploratory coverage

- Inspected the real isolated application in Polypane at **1384 × 698** (Right pane) and **296 × 698** (Left pane): sign-in, dashboard, stage navigation, municipality details/metadata, edit-dialog date picker and cancellation. Browser navigation/history, no-JavaScript authentication and persistence are additionally locked down in Playwright.
- Compared dashboard widths against the pre-upgrade v7 production image at **1384**, **390** and **296** pixels. Both versions fit at 1384/390 and overflow to a **343 px** document at 296. This extreme-narrow layout limitation is pre-existing, not introduced by the upgrade, and remains outside the framework migration.
- The default headless user agent exposed the bot-renderer mismatch above, despite the ordinary desktop-Chrome smoke profile passing. That alternate renderer is now covered explicitly rather than hiding its warnings.
- Polypane itself injects `class="in-polypane"` onto `<html>`, which React 19 reports as an attribute mismatch. This browser-tool mutation is separate from the provider mismatch; no global hydration-warning suppression was added. Polypane screenshot RPCs timed out, so visual captures were taken with Playwright instead, under `playwright/.cache/exploratory/router8-dashboard-*.png` (ignored local artifacts).

## Remaining limitations

- Repository-wide uncached ESLint still reports **9 existing errors and 20 warnings** in unchanged logic (hook state synchronization, Emotion cache mutation and complex memo dependency expressions). No rules were disabled for the upgrade.
- Production dependency audit reports **11 existing advisories: 1 critical, 3 high, 6 moderate, 1 low**. Auditing the pre-upgrade lockfile yields the same advisory IDs and severity counts; no new advisory was introduced. This includes the critical Express `proxy-addr` advisory and a Zod advisory requiring a separate major upgrade. This migration is not a dependency-hardening sign-off.
- Including development dependencies, the audit changes from **69 to 51 findings** (now 1 critical, 27 high, 20 moderate, 3 low), again with no new advisory IDs relative to the old lockfile. These remaining development-tool advisories also need a separate dependency-hardening pass.
- Credentialed Gmail/OAuth, real Infisical access, Sentry event delivery/source-map uploading and existing production database volumes require deployment-specific verification. No real credentials are used here.
- Builds emit upstream MUI source-map/pure-annotation warnings, large-chunk warnings and expected Sentry missing-token warnings in this credential-free environment.
