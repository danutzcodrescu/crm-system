# syntax=docker/dockerfile:1
FROM node:26.13.0 AS base

# set for base and all layer that inherit from it

ENV NODE_ENV=production
RUN npm install -g pnpm@10.18.3

# Install all node_modules, including dev dependencies

FROM base AS deps

WORKDIR /crm_system

ADD package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod=false

# Setup production node_modules

FROM base AS production-deps

WORKDIR /crm_system

COPY --from=deps /crm_system/node_modules /crm_system/node_modules
ADD package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm prune --prod

# Build the app

FROM base AS build

WORKDIR /crm_system

ARG SENTRY_DSN
ARG SENTRY_ORG
ARG SENTRY_PROJECT
ARG SENTRY_RELEASE
ARG SENTRY_ENVIRONMENT=production
# CI smoke images are offline. Deployment builds explicitly require uploads.
ARG SENTRY_UPLOAD=false

COPY --from=deps /crm_system/node_modules /crm_system/node_modules

ADD . .
RUN apt-get update
RUN apt-get install -y ca-certificates
RUN --mount=type=secret,id=SENTRY_AUTH_TOKEN \
    SENTRY_AUTH_TOKEN="$(cat /run/secrets/SENTRY_AUTH_TOKEN 2>/dev/null || true)" \
    VITE_SENTRY_DSN="$SENTRY_DSN" \
    VITE_SENTRY_ENVIRONMENT="$SENTRY_ENVIRONMENT" \
    SENTRY_ORG="$SENTRY_ORG" SENTRY_PROJECT="$SENTRY_PROJECT" \
    SENTRY_RELEASE="$SENTRY_RELEASE" SENTRY_UPLOAD="$SENTRY_UPLOAD" \
    pnpm package

# Finally, build the production image with minimal footprint

FROM base

WORKDIR /crm_system

# The DSN is a public ingestion key, not the build-only auth token.
ARG SENTRY_DSN
ARG SENTRY_ENVIRONMENT=production
ENV SENTRY_DSN=${SENTRY_DSN}
ENV SENTRY_ENVIRONMENT=${SENTRY_ENVIRONMENT}

COPY --from=production-deps /crm_system/node_modules /crm_system/node_modules

COPY --from=build /crm_system/dist /crm_system/dist
COPY --from=build /crm_system/public /crm_system/public
COPY package.json instrumentation.server.mjs ./

CMD ["node", "--import", "./instrumentation.server.mjs", "./dist/cmd/server.js"]
