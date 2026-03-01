#
Sensehub Auto Qual

Enterprise-grade AI qualitative research platform with project delivery management.

## Local Development

### Prerequisites
- Node.js 20+
- Docker Desktop

### Run locally
1. Copy `.env.example` to `.env` at repo root, `apps/api/.env.example` to `apps/api/.env`, and `apps/web/.env.example` to `apps/web/.env`.
2. Start infra: `docker compose -f infra/docker/docker-compose.yml up -d`
3. Install deps and generate Prisma client: run `.\install-deps.ps1` (or `npm install` then `npm run prisma:generate`). If Node.js is not installed, install it from https://nodejs.org/ first.
4. Migrate + seed: `npm run prisma:migrate` then `npm run seed` (seed creates demo workspace `demo-workspace-id` with a project, study, and synthetic sessions).
5. Start services (in separate terminals): Web `npm run dev:web`, API `npm run dev:api`, Worker `npm run dev:worker`.

### Config validation
The API validates required environment variables on boot. Missing or malformed values will stop startup.

### Tests
- `npm run test` or run `.\install-deps.ps1 -RunTests` to install and test in one go.
- `npm run test:e2e` (requires API + Web running; set `API_BASE_URL` and `WEB_BASE_URL` if not default).

### Deploy
See `docs/architecture/DEPLOYMENT.md`.

### AI provider keys
Set `OPENAI_API_KEY` and/or `ANTHROPIC_API_KEY` in `apps/api/.env`.

### Scale workers
Increase worker replicas in `infra/k8s/worker-deployment.yaml`.
