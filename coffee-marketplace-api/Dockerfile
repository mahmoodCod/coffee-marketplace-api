# syntax=docker/dockerfile:1.7

############################################
# Coffee Marketplace API — Production Image
############################################
# Multi-stage build:
#   1) deps   — install dependencies (incl. native bcrypt build tools)
#   2) build  — compile NestJS TypeScript → dist/
#   3) prod   — lean runtime image (non-root, dumb-init, healthcheck)
############################################

ARG NODE_VERSION=20.19.0

# ---------------------------------------------------------------------------
# Base
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS base

WORKDIR /app

ENV NODE_ENV=production \
    NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_FUND=false

RUN apk add --no-cache libc6-compat

# ---------------------------------------------------------------------------
# Dependencies
# ---------------------------------------------------------------------------
FROM base AS deps

# Native modules (bcrypt) need a toolchain on Alpine
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./

RUN npm ci

# ---------------------------------------------------------------------------
# Build
# ---------------------------------------------------------------------------
FROM base AS build

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build \
  && npm prune --omit=dev \
  && npm cache clean --force

# ---------------------------------------------------------------------------
# Production runtime
# ---------------------------------------------------------------------------
FROM base AS production

# dumb-init: proper PID 1 / signal forwarding
# curl: container healthchecks
RUN apk add --no-cache dumb-init curl \
  && addgroup -S nestjs \
  && adduser -S nestjs -G nestjs

ENV NODE_ENV=production \
    PORT=3000 \
    RUN_MIGRATIONS=true \
    RUN_SEEDS=false

COPY --from=build --chown=nestjs:nestjs /app/package.json ./
COPY --from=build --chown=nestjs:nestjs /app/package-lock.json ./
COPY --from=build --chown=nestjs:nestjs /app/node_modules ./node_modules
COPY --from=build --chown=nestjs:nestjs /app/dist ./dist

COPY --chown=nestjs:nestjs docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

USER nestjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -fsS "http://127.0.0.1:${PORT}/health" || exit 1

ENTRYPOINT ["dumb-init", "--", "entrypoint.sh"]
