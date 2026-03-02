# Deployment

## Docker Compose (local)
Windows note: Docker Desktop must be running with WSL2 enabled before starting compose.
1. Start infra: `docker compose -f infra/docker/docker-compose.yml up -d`
2. Run apps locally with Node (see README) or build and run app images:
   - `docker build -t sensehub/web -f apps/web/Dockerfile apps/web`
   - `docker build -t sensehub/api -f apps/api/Dockerfile apps/api`
   - `docker build -t sensehub/worker -f apps/worker/Dockerfile apps/worker`
3. Optional full stack compose (infra + apps):
   - `docker compose -f infra/docker/docker-compose.yml up -d --build`
4. Observability (optional):
   - OTEL collector is included in compose and listens on `:4318`.

Troubleshooting:
- If `docker info` returns a 500 error, restart Docker Desktop and confirm WSL2 is installed/enabled.

## Kubernetes (prod)
- Deploy config and services:
  - `infra/k8s/configmap.yaml`
  - `infra/k8s/secret.yaml`
  - `infra/k8s/services.yaml`
  - `infra/k8s/ingress.yaml`
- Observability:
  - `infra/k8s/otel-collector.yaml`
- Monitoring:
  - `infra/k8s/monitoring.yaml`
- Deploy workloads:
  - `infra/k8s/web-deployment.yaml`
  - `infra/k8s/api-deployment.yaml`
  - `infra/k8s/worker-deployment.yaml`
- Optional autoscaling and PDBs:
  - `infra/k8s/hpa.yaml`
  - `infra/k8s/pdb.yaml`
- Run migrations:
  - `infra/k8s/migration-job.yaml`

## Testing
- See `docs/architecture/RUNBOOKS.md` for local test commands.
