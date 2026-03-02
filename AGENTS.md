# Agents

## Cursor Cloud specific instructions

### Overview

Sensehub Auto Qual is an npm-workspaces monorepo with three apps (`apps/api`, `apps/web`, `apps/worker`) and shared packages under `packages/`. See `README.md` for standard commands (lint, test, build, dev).

### Infrastructure (Docker)

Four services are required: **Postgres 16**, **Redis 7**, **OpenSearch 2**, and **MinIO** (S3-compatible).

Start them with:
```
docker compose -f infra/docker/docker-compose.yml up -d postgres redis opensearch minio
```

**OpenSearch caveat:** OpenSearch 2.12+ requires `OPENSEARCH_INITIAL_ADMIN_PASSWORD`. The compose file doesn't set it, so OpenSearch will exit on first start. Run it manually:
```
docker run -d --name docker-opensearch-1 --network docker_default \
  -e discovery.type=single-node \
  -e plugins.security.disabled=true \
  -e OPENSEARCH_JAVA_OPTS="-Xms512m -Xmx512m" \
  -e OPENSEARCH_INITIAL_ADMIN_PASSWORD="SenseHub2024!" \
  -p 9200:9200 opensearchproject/opensearch:2
```

After MinIO starts, create the bucket:
```
docker exec docker-minio-1 mc alias set local http://localhost:9000 sensehub sensehubstorage
docker exec docker-minio-1 mc mb local/sensehub --ignore-existing
```

### Environment files

Create `apps/api/.env` with at minimum:
```
DATABASE_URL=postgresql://sensehub:sensehub@localhost:5432/sensehub?schema=public
REDIS_HOST=localhost
REDIS_PORT=6379
OPENSEARCH_URL=http://localhost:9200
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=sensehub
S3_SECRET_KEY=sensehubstorage
S3_BUCKET=sensehub
AI_PROVIDER=mock
EMBED_SECRET=sensehub-dev-secret-key-min16
WEB_BASE_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
JWT_SECRET=sensehub-dev-jwt-secret-key-for-local-development
JWT_ALGORITHM=HS256
```

Create `apps/web/.env`:
```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Database setup

Run `npx prisma format` before `npx prisma db push` (or `prisma generate`). The schema has a known issue where `prisma format` must be run first to fix a missing back-relation on `AccessReview`. Use `prisma db push` (not `prisma migrate dev`) since the migration history only contains incremental ALTER statements without an initial CREATE migration.

### Pre-existing code issues

- `apps/api/src/modules/search/search.module.ts` contains a duplicate module definition (the entire module is pasted twice). Remove the second copy to allow compilation.
- The API has ~9 TypeScript type errors (e.g., `jose` overload mismatch, Prisma `QueryMode` type narrowing). These are non-blocking at runtime. Use `ts-node --transpile-only` to start the API without type-checking.
- `apps/worker/tsconfig.json` needs `"moduleResolution": "node"` to override the base config's `"Bundler"` setting (which is incompatible with `"module": "CommonJS"`).

### Starting dev services

- **API:** `cd apps/api && ts-node --transpile-only src/main.ts` (or `npx ts-node --transpile-only src/main.ts`). Do NOT use `nest start --watch` as it type-checks and fails on pre-existing TS errors.
- **Web:** `npm run dev:web` (standard Next.js dev server on port 3000).
- **Worker:** `cd apps/worker && ts-node --transpile-only src/index.ts`. Runs silently waiting for BullMQ jobs.

### Seed data

Run `cd apps/api && ts-node --transpile-only src/seed.ts` to create demo workspace, project, study, and participants.

### Authentication for API calls

The auth guard requires a JWT Bearer token. With `JWT_SECRET` set in `.env`, generate a token using:
```js
const jose = require('jose');
const secret = new TextEncoder().encode('sensehub-dev-jwt-secret-key-for-local-development');
const jwt = await new jose.SignJWT({ sub: 'system', workspaceId: 'demo-workspace-id', role: 'admin' })
  .setProtectedHeader({ alg: 'HS256' }).setExpirationTime('24h').sign(secret);
```

### Testing

- `npm --workspace apps/api run test` — API unit tests (vitest); some pre-existing failures.
- `npm --workspace apps/web run test` — Web component tests (vitest + testing-library).
- `npm --workspace apps/worker run test` — Worker tests (vitest).
- Web lint (`npm --workspace apps/web run lint`) requires `.eslintrc.json` with `{"extends": "next/core-web-vitals"}`.
- API/Worker lint require `eslint.config.mjs` files with `@typescript-eslint/parser`.
- `next build` fails on a pre-existing type error in `app/client/reports/page.tsx` (setState type mismatch). The dev server (`next dev`) works fine since it skips full type-checking.
- `apps/web/vitest.config.ts` needs a `resolve.alias` mapping `@` to the web app root for the `@/lib/api` import to resolve in tests.
