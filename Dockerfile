# base node image

# TODO pass sentry data as secrets
FROM node:lts-slim AS base
ARG SENTRY_DSN=1.0.0
ARG SENTRY_ORG=1.0.0
ARG SENTRY_PROJECT=1.0.0
ARG SENTRY_AUTH_TOKEN=1.0.0

# set for base and all layer that inherit from it

ENV NODE_ENV=production

# Install all node_modules, including dev dependencies

FROM base AS deps

WORKDIR /crm_system

ADD package.json pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm approve-builds -g
RUN pnpm install --frozen-lockfile

# Setup production node_modules

FROM base AS production-deps

WORKDIR /crm_system

COPY --from=deps /crm_system/node_modules /crm_system/node_modules
ADD package.json pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm prune --prod

# Build the app

FROM base AS build

WORKDIR /crm_system

ENV SENTRY_DSN=${SENTRY_DSN}
ENV SENTRY_ORG=${SENTRY_ORG}
ENV SENTRY_PROJECT=${SENTRY_PROJECT}
ENV SENTRY_AUTH_TOKEN=${SENTRY_AUTH_TOKEN}

COPY --from=deps /crm_system/node_modules /crm_system/node_modules

ADD . .
RUN npm install -g pnpm
RUN apt-get update
RUN apt-get install -y ca-certificates
RUN pnpm package

# Finally, build the production image with minimal footprint

FROM base

WORKDIR /crm_system

COPY --from=production-deps /crm_system/node_modules /crm_system/node_modules

COPY --from=build /crm_system/dist /crm_system/dist
COPY --from=build /crm_system/public /crm_system/public
ADD . .

CMD ["npm", "run", "start"]
