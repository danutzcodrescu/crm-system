# Production Sentry and source maps

## Build and deploy

The upload credential is **build-only**. The DSN is a public ingestion key, not an
auth token; it is intentionally embedded in browser assets. Never prefix the
upload token with `VITE_` or pass it using `--build-arg`.

If the old build script was used with a real token, rotate it: that script passed
the credential as a Docker build argument and enabled verbose command logging.

For an image build only, export these variables in the build environment (keep the
token in your CI secret store, not shell history):

| Variable             | Purpose                                                                                   |
| -------------------- | ----------------------------------------------------------------------------------------- |
| `SENTRY_AUTH_TOKEN`  | Build secret with permission to create releases/upload source maps for the target project |
| `SENTRY_ORG`         | Organization slug                                                                         |
| `SENTRY_PROJECT`     | Project slug matching the DSN                                                             |
| `SENTRY_DSN`         | Public browser/server DSN                                                                 |
| `SENTRY_RELEASE`     | Unique immutable build ID, e.g. `crm-system@0.15+<git-sha>`                               |
| `SENTRY_ENVIRONMENT` | Optional; defaults to `production`                                                        |

```sh
docker build --platform linux/amd64 \
  --secret id=SENTRY_AUTH_TOKEN,env=SENTRY_AUTH_TOKEN \
  --build-arg SENTRY_UPLOAD=true \
  --build-arg SENTRY_ORG="$SENTRY_ORG" \
  --build-arg SENTRY_PROJECT="$SENTRY_PROJECT" \
  --build-arg SENTRY_DSN="$SENTRY_DSN" \
  --build-arg SENTRY_RELEASE="$SENTRY_RELEASE" \
  --build-arg SENTRY_ENVIRONMENT="${SENTRY_ENVIRONMENT:-production}" \
  --tag crm-system:production .
```

Alternatively, `pnpm build-image` loads `.env.production`, builds for amd64, and
transfers the image using SSH. It requires `REMOTE_USER` and `REMOTE` in addition
to the Sentry variables above. If `SENTRY_RELEASE` is absent, it derives
`crm-system@<package-version>+<git-sha>`. Build from a clean, committed checkout so
that ID identifies the source. This command **transfers an image to the remote
host**; it does not restart the service. It no longer prunes unrelated local images.
Nothing in the automated tests runs this deployment command against a real host.

`SENTRY_UPLOAD=true` fails the build for missing configuration or an upload error.
There is no best-effort upload fallback for deployment builds. Docker/CI builds
without this flag remain credential-free and **do not upload**; do not deploy one
expecting Sentry source-map resolution. Force a rebuild (e.g. `--no-cache`) if you
need to repeat an upload: BuildKit secret contents are not part of the cache key.

## Artifact lifecycle

1. React Router's Sentry Vite integration instruments the framework build and emits
   hidden source maps. It does not upload or delete files mid-build.
2. TypeScript compiles the custom Express/cron/database modules with maps and
   `sourcesContent`; `tsc-alias` rewrites their runtime imports.
3. `pnpm build:sentry` injects debug IDs into **all** generated JS/map pairs under
   `dist`, creates the release and uploads the artifacts when enabled. Upload
   failures stop the build.
4. It writes the release into `dist/sentry-release.json` and deletes browser maps
   under `dist/client`. Hidden maps alone are not private; deleting them prevents
   source disclosure. Express also denies `.map` requests.
5. The final image copies only production dependencies, compiled output, public
   assets, `package.json` and `instrumentation.server.mjs`. Environment files,
   tests, source trees and build tooling are not copied. Private server maps remain
   in the image, not in a static file directory.

Browser init, uploads and the baked server release use the same build ID. The
server prefers the baked release over runtime `SENTRY_RELEASE` overrides. The
previous independent `VITE_REACT_APP_VERSION` setting is no longer used.

Do **not** add `--enable-source-maps` to the production Node command/NODE_OPTIONS.
With the installed SDK, Node's early remapping removes the generated JS frame
identities needed to attach debug IDs. Production keeps generated frame positions;
Sentry resolves them using uploaded maps. A regression test captures a real SDK
exception envelope and verifies its debug ID. Private maps can still be used for
offline Node debugging with that flag.

## Runtime errors and logs

The image preloads `instrumentation.server.mjs` before Express/React Router imports.
`SENTRY_DSN` and `SENTRY_ENVIRONMENT` default to their build values and can be
overridden at runtime. Changing the browser DSN/environment requires rebuilding.
Never supply `SENTRY_AUTH_TOKEN` to a runtime container. Capture is disabled outside
production or when no DSN is configured.

- Existing React Router request, navigation and hydration handlers capture errors;
  streamed render errors and Express middleware/adapter errors are captured too.
- Production Pino output is JSON, including Error stacks. Development keeps
  `pino-pretty`. `LOG_LEVEL` defaults to `info` in production and `debug` locally.
- An explicit Pino destination forwards **warn/error/fatal** records to Sentry
  Logs after Pino redaction. It does not turn every log into a duplicate Issue.
  Request-success/info/debug logs stay on stdout. No Pino ESM patching hook is
  required, which avoids Node-version-sensitive automatic instrumentation.
- HTTP logs include only request ID, method, pathname, response status and timing;
  no headers, query strings, bodies or session cookies. SDK HTTP bodies, cookies,
  headers, query parameters, database parameters and stack local variables are
  disabled. Drizzle's raw SQL/parameter stdout logging is disabled in production.
- Traces are sampled at 10%, not the previous 100%. Replay remains masked as before.
  Browser Sentry Logs are dropped. Do not put credentials or customer records in
  free-form log messages: structured-key redaction cannot scrub arbitrary prose.

Sentry documents limitations with lower-level OpenTelemetry auto-instrumentation
on newer Node versions, including Node 26. React Router instrumentation and this
explicit log bridge do not rely on it; do not assume every database/outgoing HTTP
operation will automatically have a span.

## Verification

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test:tooling
SENTRY_UPLOAD=false pnpm build
docker run --rm -i --entrypoint node crm-system:production --input-type=module \
  < e2e/support/docker-runtime-probe.mjs
CRM_SMOKE_IMAGE=crm-system:production CRM_SMOKE_PLATFORM=linux/amd64 pnpm test:smoke
```

The tests use a memory transport and synthetic credentials, not a live Sentry
project. They check redacted log envelopes, exception debug IDs, map injection and
upload ordering, fail-closed behavior, metadata, and public-map deletion. The
production runtime probe checks private server maps/debug IDs and absence of public
maps, credentials and build-only files; the production browser asset scenario
checks that `.map` URLs return 404.

Local validation on November 16, 2026 (Node 24.22.1 host): frozen install,
typecheck, **33/33 tooling tests**, and a clean `SENTRY_UPLOAD=false pnpm package`
passed. Generated browser/server artifacts were checked for debug IDs, private
server `sourcesContent`, and absence of browser maps. Formatting/diff checks passed;
lint remains at the pre-existing nine errors and 20 warnings. Docker was stopped,
so the changed image and browser suites have **not** been re-run on Node 26 yet.

After a credentialed deployment, verify a controlled browser error and server
error in the target Sentry project: both must show the expected release/environment
and original `.tsx`/`.ts` frames, and a controlled warning must appear in Logs.
Do this in an authorized staging session, not by adding a public crash endpoint.
Local memory-transport tests cannot prove upload permissions, project/DSN matching,
ingest connectivity, quota or server-side symbolication. No live upload or remote
deployment was performed during this change.

References: [React Router setup](https://docs.sentry.io/platforms/javascript/guides/react-router/manual-setup/),
[source maps](https://docs.sentry.io/platforms/javascript/guides/react-router/sourcemaps/),
[Pino integration and version support](https://docs.sentry.io/platforms/javascript/guides/node/configuration/integrations/pino/).
