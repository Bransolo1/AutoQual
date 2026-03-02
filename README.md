# Sensehub Auto Qual

Enterprise-grade AI qualitative research platform for moderated interviews, analysis delivery, and evidence-backed insights.

## Quick start (local)
1. Install dependencies:
   - `npm install`
2. Start API + web (requires Postgres/Redis running):
   - `npm run dev:api`
   - `npm run dev:web`
3. Visit:
   - Web: http://localhost:3000
   - API: http://localhost:4000/health

## Infra (Docker)
- Start infra services:
  - `docker compose -f infra/docker/docker-compose.yml up -d`
- See `docs/architecture/DEPLOYMENT.md` and `docs/architecture/RUNBOOKS.md` for Windows notes and testing commands.

## Testing
- API: `npm --workspace apps/api run test`
- Web: `npm --workspace apps/web run test`
- Worker: `npm --workspace apps/worker run test`
- E2E (requires API + web + infra running): `npm --workspace apps/e2e run test`

## Security & privacy
- `SECURITY.md`
- `PRIVACY.md`
- Trust center overview: `docs/trust-center/README.md`
- BCP/DR plan: `docs/architecture/BCP_DR.md`
- Incident response policy: `docs/trust-center/INCIDENT_RESPONSE.md`
- Secure SDLC policy: `docs/trust-center/SDLC_SECURITY.md`

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

### Error responses
API errors are returned as structured JSON with a `requestId` for correlation across logs and audit events.

### Auth token validation
If `JWT_ISSUER` and `JWT_AUDIENCE` are set, the API will validate incoming JWT claims for enterprise SSO/OIDC compatibility.
Set `JWT_REQUIRE_JTI=true` to enforce token revocation checks.

### Audit export & retention
- `GET /audit/export.csv` exports audit logs.
- `POST /audit/export` uploads audit logs to object storage and returns a signed URL.
- `GET /audit/export-url` returns a signed URL for a stored audit export.
- `POST /audit/retention-run` deletes old audit events when `AUDIT_RETENTION_ALLOW=true`.

### SSO/OIDC placeholder
SSO configuration is exposed at `GET /auth/sso/config`. The callback endpoint is stubbed at
`POST /auth/sso/callback` for integration with your IdP.

### Token revocation
Admins can revoke JWTs by JTI using `POST /auth/tokens/revoke`.
Expired token revocations can be purged via `POST /auth/tokens/purge`.
Set `TOKEN_REVOCATION_PURGE_ENABLED=true` to schedule daily purge jobs.

### Secrets management placeholder
Set `SECRETS_PROVIDER=env` (default) or `vault` to use external secrets in production.
Health check: `GET /secrets/health`.

### Tests
- `npm run test` or run `.\install-deps.ps1 -RunTests` to install and test in one go.
- `npm run test:e2e` (requires API + Web running; set `API_BASE_URL` and `WEB_BASE_URL` if not default).

### Deploy
See `docs/architecture/DEPLOYMENT.md`.

### AI provider keys
Set `OPENAI_API_KEY` and/or `ANTHROPIC_API_KEY` in `apps/api/.env`.

### Scale workers
Increase worker replicas in `infra/k8s/worker-deployment.yaml`.
