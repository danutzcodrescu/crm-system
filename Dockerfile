# base node image

FROM node:lts-slim AS base

# set for base and all layer that inherit from it

ENV NODE_ENV=production
RUN npm install -g pnpm

# Install all node_modules, including dev dependencies

FROM base AS deps

WORKDIR /crm_system

ADD package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Setup production node_modules

FROM base AS production-deps

WORKDIR /crm_system

COPY --from=deps /crm_system/node_modules /crm_system/node_modules
ADD package.json pnpm-lock.yaml ./
RUN pnpm prune --prod

# Build the app

FROM base AS build

WORKDIR /crm_system

COPY --from=deps /crm_system/node_modules /crm_system/node_modules

ADD . .
RUN pnpm build

# Finally, build the production image with minimal footprint

FROM base

WORKDIR /crm_system

COPY --from=production-deps /crm_system/node_modules /crm_system/node_modules

COPY --from=build /crm_system/build /crm_system/build
COPY --from=build /crm_system/public /crm_system/public
ADD . .

CMD ["pnpm", "start"]
