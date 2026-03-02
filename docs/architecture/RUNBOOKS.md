# Runbooks

## Database backup (Postgres)
1. Create backup:
   - `pg_dump $DATABASE_URL > backup.sql`
2. Restore:
   - `psql $DATABASE_URL < backup.sql`

## Object storage backup (MinIO/S3)
1. Sync bucket:
   - `aws s3 sync s3://$S3_BUCKET ./backup/$S3_BUCKET --endpoint-url $S3_ENDPOINT`
2. Restore:
   - `aws s3 sync ./backup/$S3_BUCKET s3://$S3_BUCKET --endpoint-url $S3_ENDPOINT`

## Redis recovery
1. Restart Redis pod/container.
2. If queue state is lost, re-enqueue:
   - Run `POST /ops/dashboard/refresh` for affected workspaces.

## Prisma migrations
1. Run job in k8s:
   - `kubectl apply -f infra/k8s/migration-job.yaml`
2. Local dev:
   - `npm run prisma:migrate`

## Incident response (API down)
1. Check API logs for startup failures.
2. Verify DB/Redis/OpenSearch/MinIO connectivity.
3. Confirm env vars loaded (ConfigMap/Secret).
4. Roll back last deployment if needed.

## Alerts & monitoring (minimum)
- Track API error rate, latency, and worker queue lag.
- Alert on:
  - 5xx spike
  - Redis down
  - DB connection failures
  - worker job failures

## Monitoring stack (local)
Windows note: ensure Docker Desktop is running with WSL2 enabled.
1. Start monitoring services:
   - `docker compose -f infra/docker/docker-compose.yml up -d prometheus grafana`
2. Prometheus: http://localhost:9090
3. Grafana: http://localhost:3001 (admin / admin)

## Docker Desktop (Windows) quick fix
1. Confirm WSL2 is installed: `wsl --install --no-distribution` (requires reboot).
2. Reboot and open Docker Desktop until it reports Running.
3. If the daemon still fails, restart Docker Desktop and try again.
