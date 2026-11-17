# Production fixes: 0.15.2

Investigation date: November 17, 2026. Sentry release affected: `0.15.1`.

## Expected missing routes (CRM-SYSTEM-6 and CRM-SYSTEM-7)

Requests for `/.git/config` and `/apple-touch-icon-precomposed.png` already returned
404, but React Router's implicit no-match error invoked `entry.server.handleError`,
which logged and captured them in Sentry. The former is consistent with scanning;
the latter can be requested by normal browsers too.

An explicit top-level `*` route now returns a 404 response without throwing. It
lives outside the authenticated layout, handles both loaders and actions, and
renders a small not-found page. No Sentry filters or general error suppression were
added. A real exception in a matching route still returns 500 and invokes the error
hook.

`tests/not-found-route.test.ts` drives the real React Router request handler with
the registered fallback module and a recorded error hook. It covers GET/HEAD and
mutations, document and `.data` requests. Before the route was added, the test
failed because expected misses invoked the hook; afterwards it passes. Seeded
browser/API scenarios cover the production route registrations separately.

## Municipality hydration (CRM-SYSTEM-8)

The replay records a recoverable hydration error about two seconds after initial
page load. Its browser culture is Swedish and time zone is Europe/Stockholm. The
replay exposes only `React hydration recovered from an error [object Object]`;
the linked exception event is unavailable through Sentry. The production event
therefore does not provide a DOM diff or component stack to independently confirm
the exact cell involved.

A local browser reproduction on the actual municipality UI found a concrete
matching failure: the contacts table's Updated column returned a `Date` accessor
without an explicit renderer. The default table cell converted it to a raw
`Date.toString()`, producing different text on the UTC server and Stockholm client:

```text
Server: Mon Nov 16 2026 23:30:00 GMT+0000 (Coordinated Universal Time)
Client: Tue Nov 17 2026 00:30:00 GMT+0100 (centraleuropeisk normaltid)
```

The mismatch was reproduced with synthetic data in the full municipality UI and
then reduced to one row in the real `ResponsiblesTable`. The Updated cell now uses
the application's existing Stockholm/Swedish `formatDate` helper. Its Date-valued
accessor is unchanged, preserving chronological sorting. No hydration warnings are
suppressed and the page remains server-rendered.

Regression checks:

- `tests/responsibles-hydration.test.ts`: rendered cell text must be identical in
  UTC, Europe/Stockholm and America/Los_Angeles, including a timestamp crossing
  Stockholm midnight. It failed before the fix and passes afterwards.
- `pnpm test:hydration`: builds the real municipality UI, server-renders synthetic
  loader data, then hydrates in real Chromium contexts with different locales/time
  zones. It asserts no recoverable hydration errors or browser console/page errors.
  The pre-fix UTC control passed while the Swedish/Stockholm context failed; after
  the renderer fix both pass. The final test also covers America/Los_Angeles.

The browser harness removes only server loader/meta exports and their imports,
as framework client compilation does. The rendered view, its child components,
theme, localization and Emotion setup remain real. Server-only imports are rejected
by the harness. No database, credentials, live Sentry transport or production data
are used.

## Commands and limitations

Validation on the Node 24.22.1 host passed: frozen install, both type checks,
**36/36 tooling tests**, the Chromium hydration test in all three contexts, and a
clean production package build with Sentry uploading disabled. Formatting and
`git diff --check` pass. Lint remains at the existing nine errors and 20 warnings;
no findings were suppressed.

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test:tooling
pnpm exec playwright install chromium
pnpm test:hydration
SENTRY_UPLOAD=false pnpm package
```

The isolated browser test also runs in CI after Chromium installation. The seeded
development/production suites still require Docker, which is stopped on this host.
No remote deployment, live error injection or Sentry issue-status changes were
performed. Deploy `0.15.2`, then monitor the linked issues for recurrence:

- [CRM-SYSTEM-6](https://danut-empire.sentry.io/issues/CRM-SYSTEM-6)
- [CRM-SYSTEM-7](https://danut-empire.sentry.io/issues/CRM-SYSTEM-7)
- [CRM-SYSTEM-8](https://danut-empire.sentry.io/issues/CRM-SYSTEM-8)
