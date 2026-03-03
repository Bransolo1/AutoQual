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

# Build args for public vars baked at build time
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN npm --workspace apps/web run build

# ── Stage 3: production runtime ───────────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/node_modules          ./node_modules
COPY --from=build /app/apps/web/.next        ./apps/web/.next
COPY --from=build /app/apps/web/public       ./apps/web/public
COPY --from=build /app/apps/web/package.json ./apps/web/package.json

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/healthz || exit 1

CMD ["npm", "--workspace", "apps/web", "run", "start"]
