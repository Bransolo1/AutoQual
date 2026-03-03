# AutoQual – Operational Runbooks

> **Conventions**
> - `$NS` = the Kubernetes namespace (e.g. `sensehub-production`)
> - `$CLUSTER` = EKS cluster name from `infra/terraform/envs/production/`
> - Commands assume `kubectl` context is already set to the correct cluster.

---

## 1. Database Backup and Restore (AWS RDS Postgres)

### Automated backups
AWS RDS takes automated daily snapshots when `postgres_backup_retention_days >= 1` (set to `7` in production by default). No manual action needed for routine backups.

### Manual snapshot before a risky migration
```bash
aws rds create-db-snapshot \
  --db-instance-identifier production-postgres \
  --db-snapshot-identifier "pre-migration-$(date +%Y%m%d%H%M%S)" \
  --region us-east-1
```

### Restore from snapshot
```bash
# 1. Identify snapshot to restore
aws rds describe-db-snapshots \
  --db-instance-identifier production-postgres \
  --query 'DBSnapshots[*].[DBSnapshotIdentifier,SnapshotCreateTime]' \
  --output table

# 2. Restore to a NEW instance (never overwrite production directly)
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier production-postgres-restore \
  --db-snapshot-identifier <snapshot-id> \
  --db-instance-class db.t3.medium

# 3. Verify data, then if ok, update DATABASE_URL secret to point to restored instance
# 4. Run migrations: kubectl -n $NS delete job sensehub-prisma-migrate; kubectl -n $NS apply -f infra/k8s/base/prisma-migrate-job.yaml
```

### Point-in-time restore
```bash
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier production-postgres \
  --target-db-instance-identifier production-postgres-pitr \
  --restore-time "2026-03-01T12:00:00Z"
```

---

## 2. Object Storage Backup and Restore (S3)

### Cross-region replication (recommended for production)
Set up replication in Terraform (not yet configured — add to `modules/data/main.tf`).

### Manual sync to backup bucket
```bash
aws s3 sync s3://$RAW_MEDIA_BUCKET s3://$RAW_MEDIA_BUCKET-backup \
  --source-region us-east-1 \
  --region us-west-2
```

### Restore a deleted object (versioning enabled)
```bash
# List versions for a key
aws s3api list-object-versions --bucket $RAW_MEDIA_BUCKET --prefix <key>

# Copy the desired version back as the current version
aws s3api copy-object \
  --bucket $RAW_MEDIA_BUCKET \
  --copy-source "$RAW_MEDIA_BUCKET/<key>?versionId=<version-id>" \
  --key <key>
```

---

## 3. Prisma Migrations (Production)

**Never run `prisma migrate dev` in production. Always use `migrate deploy`.**

### Run migrations via Kubernetes Job (normal path)
```bash
# The deploy workflow runs this automatically. To run manually:
kubectl -n $NS delete job sensehub-prisma-migrate --ignore-not-found
kubectl -n $NS apply -f infra/k8s/base/prisma-migrate-job.yaml
kubectl -n $NS wait job/sensehub-prisma-migrate --for=condition=complete --timeout=180s
kubectl -n $NS logs job/sensehub-prisma-migrate
```

### Check pending migrations
```bash
# Run locally against production DB (via bastion or port-forward)
kubectl -n $NS port-forward svc/sensehub-api 4000:4000 &
DATABASE_URL="<prod-db-url>" npx prisma migrate status --schema apps/api/prisma/schema.prisma
```

### Emergency rollback of a bad migration
```bash
# Prisma does not support automatic rollback. Steps:
# 1. Restore from RDS snapshot (see section 1)
# 2. Redeploy the previous image tag
# 3. Apply the migration job with the previous image
```

---

## 4. Secrets Rotation

### Rotate JWT_SECRET / JWT_JWKS_URL
1. If using OIDC JWKS: rotate the IdP client secret; the JWKS URL rotates automatically.
2. If using `JWT_SECRET`:
   ```bash
   NEW_SECRET=$(openssl rand -hex 32)
   # Update in AWS Secrets Manager:
   aws secretsmanager update-secret \
     --secret-id autoqual-production-app-secrets \
     --secret-string "{\"JWT_SECRET\":\"$NEW_SECRET\", ...}"
   # Sync to K8s via External Secrets Operator (runs automatically) or:
   kubectl -n $NS create secret generic sensehub-secrets \
     --from-literal=JWT_SECRET="$NEW_SECRET" \
     --dry-run=client -o yaml | kubectl apply -f -
   # Restart pods to pick up new secret:
   kubectl -n $NS rollout restart deployment/sensehub-api
   ```
3. Active sessions will fail until users re-login. Consider enabling `JWT_REQUIRE_JTI=true` to revoke all tokens by JTI.

### Rotate DATABASE_URL credentials
```bash
# 1. Create new RDS master password
aws rds modify-db-instance \
  --db-instance-identifier production-postgres \
  --master-user-password "$NEW_DB_PASS" \
  --apply-immediately

# 2. Update secret and restart
kubectl -n $NS rollout restart deployment/sensehub-api
kubectl -n $NS rollout restart deployment/sensehub-worker
```

### Rotate EMBED_SECRET
After rotation all existing embed signed tokens are invalidated immediately. Notify customers before rotating.

### Rotate SESSION_SECRET (web)
All active web sessions are invalidated. Users must re-login. Rotate during low-traffic periods.

---

## 5. Incident Response — API Down

### Diagnosis checklist
```bash
# 1. Check pod status
kubectl -n $NS get pods

# 2. Check recent events
kubectl -n $NS get events --sort-by='.lastTimestamp' | tail -20

# 3. Check API logs
kubectl -n $NS logs deployment/sensehub-api --tail=100

# 4. Check readiness probe failures
kubectl -n $NS describe deployment/sensehub-api | grep -A5 "Conditions"

# 5. Verify dependencies
kubectl -n $NS exec deployment/sensehub-api -- \
  wget -qO- http://localhost:4000/health
```

### Common causes and fixes

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| CrashLoopBackOff | Missing env var | Check `kubectl describe pod` for env errors |
| 503 from ingress | All pods unready | Check readiness probe path `/health` |
| DB connection refused | Wrong `DATABASE_URL` | Verify secret value |
| OOMKilled | Memory limit too low | Increase `limits.memory` in deployment |
| Worker jobs stuck | Redis connectivity | `kubectl exec` into worker, test Redis |

### Rollback
```bash
kubectl -n $NS rollout undo deployment/sensehub-api
kubectl -n $NS rollout undo deployment/sensehub-web
kubectl -n $NS rollout undo deployment/sensehub-worker
kubectl -n $NS rollout status deployment/sensehub-api
```

---

## 6. Smoke Test Checklist (Run After Every Release)

Run these checks in sequence after a deploy. The CD workflow does this automatically but the list is here for manual verification.

| # | Check | Command | Expected |
|---|-------|---------|----------|
| 1 | Web health | `curl https://$DOMAIN/api/healthz` | `{"status":"ok"}` |
| 2 | API health | `curl https://$DOMAIN/api/health` | `{"status":"ok"}` |
| 3 | Auth required | `curl https://$DOMAIN/api/projects` | HTTP 401 |
| 4 | Login redirect | Browser: `https://$DOMAIN/projects` | Redirect to /auth/login |
| 5 | SSO flow | Browser: complete SSO login | Lands at / with user in nav |
| 6 | Create project | POST `/api/projects` with valid JWT | HTTP 201 |
| 7 | Upload URL | GET `/api/media/upload-url?storageKey=test/file.mp4` | 200 with url |
| 8 | Search | GET `/api/search?q=test` | 200 |
| 9 | Worker metrics | `kubectl -n $NS logs deployment/sensehub-worker --tail=20` | No error logs |
| 10 | No 500s in last 5min | Grafana → API Error Rate panel | < 0.1% |

---

## 7. Monitoring and Alerting

### Access Grafana (local dev)
```bash
docker compose -f infra/docker/docker-compose.yml up -d grafana
open http://localhost:3001   # admin / admin
```

### Key dashboards
- **API Overview**: request rate, error rate, latency p50/p95/p99
- **Worker Queue**: job throughput, failure rate, queue depth
- **Database**: connection pool, query latency
- **Node**: CPU, memory, disk per EKS node

### Key Prometheus alerts (in `infra/monitoring/alerts.yml`)
| Alert | Threshold | Action |
|-------|-----------|--------|
| APIHighErrorRate | > 5% 5xx for 5min | Page on-call |
| WorkerJobFailures | > 10 failures/min | Investigate DLQ |
| DBConnectionsFull | > 90% pool | Scale API pods or DB |
| OpenSearchUnhealthy | Cluster yellow/red | Check OS logs |

---

## 8. Emergency Procedures

### Force-delete a stuck namespace
```bash
kubectl get namespace $NS -o json | \
  jq '.spec.finalizers = []' | \
  kubectl replace --raw "/api/v1/namespaces/$NS/finalize" -f -
```

### Drain a node safely
```bash
kubectl drain <node-name> --ignore-daemonsets --delete-emptydir-data --grace-period=60
```

### Scale to zero (maintenance mode)
```bash
kubectl -n $NS scale deployment/sensehub-api --replicas=0
kubectl -n $NS scale deployment/sensehub-web --replicas=0
kubectl -n $NS scale deployment/sensehub-worker --replicas=0
```

### Scale back
```bash
kubectl -n $NS scale deployment/sensehub-api --replicas=2
kubectl -n $NS scale deployment/sensehub-web --replicas=2
kubectl -n $NS scale deployment/sensehub-worker --replicas=2
```
