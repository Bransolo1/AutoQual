# Key Management & Rotation (Template)

## Scope
Applies to API secrets, JWT signing keys, database credentials, and encryption keys.

## Storage
- Store secrets in managed secret storage (TBD)
- Restrict access to production keys with MFA

## Rotation
- JWT signing keys: quarterly or on incident
- Database credentials: quarterly or on incident
- API keys: per customer policy

## Revocation
Use token revocation and rotation on compromise.

## Audit
Log key access and rotation events.
