# SOC 2 Checklist (Draft)

## Security
- [ ] Asset inventory for API, web, worker, infra
- [ ] Vulnerability scanning + dependency review cadence
- [ ] Access control and least-privilege for admin endpoints
- [ ] Request logging with unique request IDs
- [ ] MFA for production admin accounts

## Availability
- [ ] Health checks and uptime monitoring
- [ ] Incident response playbook and on-call rotation
- [ ] Backup and restore process (DB + object storage)

## Confidentiality
- [ ] Encryption in transit (TLS) across services
- [ ] Encryption at rest (DB + object storage)
- [ ] Signed URL access for media and exports

## Processing Integrity
- [ ] Audit events for critical workflows
- [ ] Review workflow gating for insight approval
- [ ] Pipeline job traceability

## Privacy
- [ ] Data retention policy and automated cleanup
- [ ] PII redaction pipeline
- [ ] Data export access controls

## Evidence artifacts
- [ ] Security overview document (SECURITY.md)
- [ ] Threat model (docs/threat-model/README.md)
- [ ] Architecture overview (docs/architecture/OVERVIEW.md)
- [ ] Deployment guide (docs/architecture/DEPLOYMENT.md)
