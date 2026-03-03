# ── Stage 1: install all deps ─────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json     apps/api/package.json
COPY apps/web/package.json     apps/web/package.json
COPY apps/worker/package.json  apps/worker/package.json
COPY packages/ai-adapters/package.json packages/ai-adapters/package.json
COPY packages/auth/package.json        packages/auth/package.json
COPY packages/audit/package.json       packages/audit/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
COPY packages/media-utils/package.json  packages/media-utils/package.json
COPY packages/insight-engine/package.json packages/insight-engine/package.json

RUN npm ci

# ── Stage 2: build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm --workspace apps/worker run build

# ── Stage 3: production runtime ───────────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/node_modules              ./node_modules
COPY --from=build /app/apps/worker/dist          ./apps/worker/dist
COPY --from=build /app/apps/worker/package.json  ./apps/worker/package.json

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD pgrep -f "node apps/worker" || exit 1

CMD ["node", "apps/worker/dist/index.js"]
