# Deployment

## Docker Compose (local)
1. Start infra: `docker compose -f infra/docker/docker-compose.yml up -d`
2. Run apps locally with Node (see README) or build and run app images:
   - `docker build -t sensehub/web -f apps/web/Dockerfile apps/web`
   - `docker build -t sensehub/api -f apps/api/Dockerfile apps/api`
   - `docker build -t sensehub/worker -f apps/worker/Dockerfile apps/worker`

## Kubernetes (prod)
- `infra/k8s/web-deployment.yaml`
- `infra/k8s/api-deployment.yaml`
- `infra/k8s/worker-deployment.yaml`
