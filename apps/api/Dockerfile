# ── Stage 1: install all deps (including dev) ────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# Copy only manifests first for better cache reuse
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

# Generate Prisma client before compiling
RUN npm --workspace apps/api run prisma:generate
RUN npm --workspace apps/api run build

# ── Stage 3: production runtime ───────────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app

# openssl is required by Prisma on Alpine
RUN apk add --no-cache openssl

ENV NODE_ENV=production

# Only copy what the API needs at runtime
COPY --from=build /app/node_modules               ./node_modules
COPY --from=build /app/apps/api/dist              ./apps/api/dist
COPY --from=build /app/apps/api/package.json      ./apps/api/package.json
COPY --from=build /app/apps/api/prisma            ./apps/api/prisma

EXPOSE 4000

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:4000/health || exit 1

CMD ["node", "apps/api/dist/main.js"]
