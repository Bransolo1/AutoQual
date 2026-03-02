# Backup and retention runbook

## Purpose
This runbook defines how to perform backups, retention enforcement, and restore tests.

## Backup cadence
- Postgres: daily full backups with PITR enabled.
- Object storage: versioning + lifecycle policy to retain deleted objects.
- OpenSearch: scheduled snapshots to a dedicated snapshot repository.

## Retention enforcement
1. Confirm retention policy in `docs/architecture/DATA_RESIDENCY.md`.
2. Ensure legal hold flags are honored.
3. Run retention job:
   - If using CronJob: `infra/k8s/addons/cronjobs/retention.yaml`
4. Verify audit logs contain retention events.

## Restore test (quarterly)
1. Restore Postgres to a staging environment.
2. Restore object storage objects (versioned).
3. Restore OpenSearch snapshot into staging.
4. Run smoke tests:
   - Login and list projects
   - Search insights
   - Fetch transcripts

## RPO/RTO checklist
- RPO target met: yes/no
- RTO target met: yes/no
- Evidence recorded in `docs/architecture/EVIDENCE_REVIEW_LOG.md`
