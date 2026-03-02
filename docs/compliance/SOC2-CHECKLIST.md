# SOC 2 Checklist (Draft)

## Security
- [ ] Asset inventory for API, web, worker, infra
- [ ] Vulnerability scanning + dependency review cadence
- [ ] Access control and least-privilege for admin endpoints
- [ ] Request logging with unique request IDs
- [ ] MFA for production admin accounts
- [ ] Data classification policy (docs/trust-center/DATA_CLASSIFICATION.md)
- [ ] Key management & rotation policy (docs/trust-center/KEY_MANAGEMENT.md)

## Availability
- [ ] Health checks and uptime monitoring
- [ ] Incident response playbook and on-call rotation
- [ ] Backup and restore process (DB + object storage)
- [ ] BCP/DR plan with RTO/RPO (docs/architecture/BCP_DR.md)
## Incident response
- [ ] Breach notification policy (docs/trust-center/INCIDENT_RESPONSE.md)

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
- [ ] Vulnerability disclosure policy (docs/trust-center/VULNERABILITY_DISCLOSURE.md)
- [ ] Threat model (docs/threat-model/README.md)
- [ ] Architecture overview (docs/architecture/OVERVIEW.md)
- [ ] Deployment guide (docs/architecture/DEPLOYMENT.md)
- [ ] Data Processing Addendum (docs/trust-center/DPA.md)
- [ ] Subprocessor list (docs/trust-center/SUBPROCESSORS.md)
- [ ] Penetration test summary (docs/trust-center/PEN_TEST_SUMMARY.md)
- [ ] DPIA template (docs/trust-center/DPIA_TEMPLATE.md)
- [ ] Data residency overview (docs/trust-center/DATA_RESIDENCY.md)
- [ ] SLA & support policy (docs/trust-center/SLA_SUPPORT.md)
- [ ] Data classification policy (docs/trust-center/DATA_CLASSIFICATION.md)
- [ ] Key management & rotation (docs/trust-center/KEY_MANAGEMENT.md)
- [ ] Incident response policy (docs/trust-center/INCIDENT_RESPONSE.md)
