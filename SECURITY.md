# Security Policy

## Supported versions
Security fixes apply to the `main` branch and the latest release artifacts.

## Reporting a vulnerability
Please report security issues privately to the maintainers. If you do not have a direct contact,
open a GitHub security advisory or use repository email if provided.

Include:
- A clear description of the issue
- Steps to reproduce
- Impact assessment
- Suggested remediation (if any)

## Operational security notes
This codebase includes:
- Role-based access control and workspace isolation
- Audit logging and retention controls
- Rate limiting and security headers on the API
- Token revocation and revocation purge job

Operators should:
- Run the API behind TLS
- Rotate secrets regularly
- Enable database backups and retention policies
- Monitor audit logs for anomalies

## Incident response (summary)
1. Contain: revoke exposed tokens and rotate secrets.
2. Eradicate: patch the vulnerability and deploy.
3. Recover: verify services and run post-incident review.
# Security Overview

## Threat Model
- Untrusted client input over public APIs
- Insider misuse of client data
- LLM prompt injection and data exfiltration
- Object storage exposure of media artifacts
- Workspace boundary bypass

## Attack Surface
- REST API
- Web app session cookies/JWT
- Media upload endpoints
- Worker queues and storage access
- Search index ingestion

## Media Handling Risks
- Secure, signed URLs for S3-compatible storage
- Time-limited access tokens
- Server-side validation for content type and size
- Encrypted storage at rest

## LLM Hallucination Risk
- Deterministic mock adapter for test mode
- Confidence scoring with traceability to evidence
- Reviewer workflow before approval

## Data Retention Strategy
- Workspace-level retention configuration
- Soft delete with audit log
- Automated archival of stale media

## Encryption Model
- TLS for all network traffic
- Object storage encryption at rest
- Database encryption at rest

## Vulnerability Disclosure
If you discover a security issue, please report it responsibly.

1. Email: security@sensehub.ai (or your internal security alias)
2. Provide a clear description, steps to reproduce, and impact
3. Do not publicly disclose until coordinated with the team
