# Hosting Architecture Deliverables

This document implements the execution outputs referenced in the hosting architecture plan.

## Deployment checklist

### Foundation
1. Register domain and configure DNS for `yourdomain.com`.
2. Create TLS certificates via automated certificate manager.
3. Provision CDN and WAF with rate limits and request size limits.
4. Provision load balancer and ingress controller.
5. Create private VPC subnets for compute and data services.

### Data plane
1. Provision managed Postgres with PITR enabled.
2. Provision managed Redis with persistence and TLS.
3. Provision managed OpenSearch with snapshots enabled.
4. Provision object storage buckets for raw and derived artifacts.
5. Configure bucket lifecycle and versioning policies.

### Compute
1. Create Kubernetes cluster with private node groups.
2. Configure namespaces: `staging`, `production`.
3. Install ingress controller and cert manager.
4. Configure workload identity/service accounts.
5. Install OpenTelemetry collector.

### Security and access
1. Configure OIDC app and callback URLs per environment.
2. Configure secrets manager and workload identity access.
3. Enforce RBAC roles and least privilege service accounts.
4. Enable audit logging and retention jobs.

### Observability
1. Provision Prometheus and Grafana.
2. Configure log pipeline (Loki or cloud log service).
3. Create core dashboards and alert rules.

### Deployment
1. Build and publish container images.
2. Configure GitOps repo and environment overlays.
3. Apply Prisma migrations as a deploy job.
4. Deploy web, api, worker with canary and rollback.

## Terraform module outline

### `modules/network`
- VPC, subnets, route tables
- NAT gateways and egress controls
- Security groups for load balancer, cluster, data services

### `modules/kubernetes`
- Kubernetes cluster and node groups
- OIDC provider for workload identity
- Cluster logging and metrics add-ons

### `modules/edge`
- DNS zone records
- CDN distribution and origin settings
- WAF rules and rate limits
- Load balancer and TLS certificates

### `modules/data`
- Managed Postgres with PITR
- Managed Redis with encryption and auth
- Managed OpenSearch with snapshots
- Object storage buckets with lifecycle rules

### `modules/observability`
- OpenTelemetry collector
- Prometheus and Grafana
- Log storage (Loki or vendor service)

### `modules/secrets`
- Secrets manager vault
- IAM policies for least privilege access

## Kubernetes manifest outline

### Base
- `namespace.yaml` for `staging` and `production`
- `configmap.yaml` for non-secret config
- `secretproviderclass.yaml` for secrets manager integration

### Deployments
- `web-deployment.yaml` (Next.js)
- `api-deployment.yaml` (NestJS)
- `worker-deployment.yaml` (BullMQ)

### Services and ingress
- `web-service.yaml`
- `api-service.yaml`
- `ingress.yaml` with `/` and `/api` routing

### Jobs
- `prisma-migrate-job.yaml`
- `retention-job.yaml`

### Observability
- `otel-collector.yaml`
- `service-monitor.yaml` for Prometheus

## Staged rollout plan

### Stage 0: Local and CI
1. Ensure local dev uses `.env.example` and no secrets are committed.
2. Add CI checks: lint, test, typecheck, build.
3. Add container image build and scan.

### Stage 1: Staging
1. Provision staging data services and storage.
2. Deploy cluster and ingress.
3. Deploy web, api, worker.
4. Configure OIDC staging app and secrets.
5. Validate upload, transcription, redaction, and export flows.

### Stage 2: Production
1. Provision production data services and storage.
2. Configure production DNS, CDN, WAF, and TLS.
3. Deploy production workloads with canary.
4. Run migration job and verify read/write paths.
5. Validate SLOs, alerting, and backup policies.

### Stage 3: Enterprise single-tenant option
1. Package a Docker Compose stack with reverse proxy.
2. Automate backups, upgrades, and patching.
3. Provide a tenant-specific runbook and SLA targets.
