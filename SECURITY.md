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
