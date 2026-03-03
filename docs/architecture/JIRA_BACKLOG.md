# Jira Backlog (AutoQual)

## EPIC A: Security and enterprise foundations

---
Summary: A1 Remove header-based auth bypass and enforce signed token verification  
Issue Type: Story  
Priority: P0  
Description: AuthGuard currently accepts header impersonation and decodes JWT without signature verification.  
Acceptance Criteria:
- Non-dev environments reject unsigned/invalid JWTs.
- Header impersonation is removed or strictly dev-only.
- JWT validation checks issuer, audience, expiry, and JTI when required.
- Workspace and role are derived from token claims and server lookup.

---
Summary: A2 Lock down public endpoints and auth decorators  
Issue Type: Story  
Priority: P0  
Description: Public routes are too permissive, especially media processing.  
Acceptance Criteria:
- Every route declares auth posture (public/authenticated/role-gated).
- Public routes limited to participant capture with one-time tokens.
- Media processing requires admin/system role.
- Add authorization tests across protected endpoints.

---
Summary: A2 Authorization posture test suite  
Issue Type: Story  
Priority: P0  
Description: There is no automated test to validate public/auth/role-gated routes.  
Acceptance Criteria:
- Test enumerates controllers and validates auth posture metadata.
- Public routes limited to participant embed flow only.

---
Summary: A3 Production search security posture  
Issue Type: Story  
Priority: P0  
Description: OpenSearch security is disabled in local config.  
Acceptance Criteria:
- Production enables OpenSearch security and TLS.
- API uses least-privilege credentials from secrets.
- Health checks and alerts cover search connectivity.

---
Summary: A3 Search health checks and alerting  
Issue Type: Story  
Priority: P0  
Description: Search connectivity lacks health checks and alert hooks.  
Acceptance Criteria:
- Health check verifies OpenSearch connectivity.
- Alerting configured for search failures.

---
Summary: A4 Real SSO OIDC flow  
Issue Type: Story  
Priority: P1  
Description: SSO callback is a stub.  
Acceptance Criteria:
- OIDC auth code flow works with at least one IdP.
- Provision users into workspace with default role on first login.
- Logout and refresh tokens supported.
- Admin can restrict domains and map groups to roles.

---
Summary: A4 SSO session management + MFA claim  
Issue Type: Story  
Priority: P1  
Description: OIDC refresh/logout and MFA enforcement are missing.  
Acceptance Criteria:
- Refresh token support and logout flow implemented.
- Optional MFA claim enforcement and domain restrictions.

---
Summary: A5 Secrets management integration  
Issue Type: Story  
Priority: P1  
Description: Secrets provider is a placeholder.  
Acceptance Criteria:
- Secrets interface with env + external provider.
- Non-local envs remove secrets from compose defaults.
- Rotation runbook exists.

## EPIC B: Participant and interview experience

---
Summary: B1 Participant interview application  
Issue Type: Story  
Priority: P1  
Description: No participant UX exists.  
Acceptance Criteria:
- Participant can open session, review consent, record or type responses.
- Progress and resume support (when enabled).
- Session locked to one-time token.

---
Summary: B1 Participant media capture experience  
Issue Type: Story  
Priority: P1  
Description: Interview UI lacks real video/audio capture.  
Acceptance Criteria:
- Capture video/audio per study mode.
- Store turns with media and transcript placeholders.

---
Summary: B2 AI moderated interview orchestration  
Issue Type: Story  
Priority: P1  
Description: Moderator logic is placeholder.  
Acceptance Criteria:
- Structured guide schema (sections, questions, probes, stop conditions).
- Turn loop selects next question based on answers.
- Multi-language prompts and translation strategy.
- Safety policy for disallowed content and escalation.

---
Summary: B2 Moderation policy engine  
Issue Type: Story  
Priority: P1  
Description: No adaptive policy engine for turn selection or safety.  
Acceptance Criteria:
- Policy engine selects next question based on coverage.
- Locale-specific prompts with translation strategy.
- Safety escalation/termination rules.

---
Summary: B3 Recruitment quality and fraud signals  
Issue Type: Story  
Priority: P1/P2  
Description: Add verification quality controls and quota enforcement.  
Acceptance Criteria:
- Device fingerprint and duplicate detection.
- Server-side screening logic execution.
- Quota enforcement blocks recruitment when full.
- Optional: external panel adapters (P2).

---
Summary: B3 Velocity checks and duplicate detection  
Issue Type: Story  
Priority: P1  
Description: Fraud signals are not enforced beyond basic fields.  
Acceptance Criteria:
- Velocity checks for rapid signups.
- Duplicate detection for device/participant signals.

## EPIC C: Media, transcription, evidence

---
Summary: C1 Object storage-first media pipeline  
Issue Type: Story  
Priority: P1  
Description: Local file storage is still used.  
Acceptance Criteria:
- Presigned uploads to object storage.
- Media states: uploaded, processing, ready, failed.
- Retention impacts object storage lifecycle.

---
Summary: C1 Chunked upload endpoints  
Issue Type: Story  
Priority: P1  
Description: Chunk upload endpoints are placeholders.  
Acceptance Criteria:
- Chunked upload fully implemented against object storage.
- Server persists object keys and metadata only.

---
Summary: C2 Real transcription with word timestamps  
Issue Type: Story  
Priority: P1  
Description: Transcript creation is placeholder.  
Acceptance Criteria:
- Audio extraction + transcription with word timestamps.
- Store raw and redacted text + timing data.
- Optional diarization with confidence.

---
Summary: C2 Transcription pipeline integration  
Issue Type: Story  
Priority: P1  
Description: Worker does not run real transcription jobs.  
Acceptance Criteria:
- Audio extraction and transcription job pipeline.
- Store word timestamps and diarization (optional).

---
Summary: C3 Evidence attachment UX and API  
Issue Type: Story  
Priority: P1  
Description: Evidence UI is missing.  
Acceptance Criteria:
- Highlight transcript ranges and attach to insight.
- Clip timeline selection attaches video evidence.
- Evidence coverage endpoint is accurate.

---
Summary: C3 Evidence viewer with timeline  
Issue Type: Story  
Priority: P1  
Description: Evidence UX lacks timeline and highlight tooling.  
Acceptance Criteria:
- Transcript highlight attaches evidence to insight.
- Clip timeline selection attaches to insight.
- Coverage gaps actionable in UI.

---
Summary: C4 PII detection and redaction upgrade  
Issue Type: Story  
Priority: P2  
Description: Regex-only redaction is insufficient.  
Acceptance Criteria:
- Entity detection for common PII classes.
- Store redaction offsets and metadata.
- Reviewer UI to unredact with audit logging.

---
Summary: C4 Reviewer unredact flow  
Issue Type: Story  
Priority: P2  
Description: No reviewer UI for controlled unredaction.  
Acceptance Criteria:
- Reviewer UI to unredact with audit logging.

## EPIC D: Insight synthesis

---
Summary: D1 Structured LLM insight pipeline  
Issue Type: Story  
Priority: P1  
Description: Mock insight adapter is used.  
Acceptance Criteria:
- Strict JSON schema validation for insight outputs.
- Prompts use study context and guide.
- Insights include implication, confidence, tags, evidence suggestions.
- Retries and provenance stored.

---
Summary: D1 Real provider structured outputs  
Issue Type: Story  
Priority: P1  
Description: Provider adapters return raw responses.  
Acceptance Criteria:
- LLM responses validated against strict JSON schema.
- Retries/fallbacks and provenance stored.

---
Summary: D2 Theme coding and clustering  
Issue Type: Story  
Priority: P1  
Description: Theme generation is placeholder.  
Acceptance Criteria:
- Stable theme taxonomy with insight mappings.
- Segment-aware theme analysis.
- UI filtering by theme.

---
Summary: D2 Theme taxonomy + segment mapping  
Issue Type: Story  
Priority: P1  
Description: Themes are not stable or segment-aware.  
Acceptance Criteria:
- Stable taxonomy and mapping per segment.
- UI filtering by theme/segment.

---
Summary: D3 Retrieval and semantic search  
Issue Type: Story  
Priority: P2  
Description: Improve search experience.  
Acceptance Criteria:
- Index transcripts, insights, themes, story blocks.
- Semantic + keyword fallback.
- Evidence-aware results with snippets.

---
Summary: D3 Evidence snippets and jump links  
Issue Type: Story  
Priority: P2  
Description: Search results lack evidence snippets.  
Acceptance Criteria:
- Evidence snippets with jump links.

## EPIC E: Activation layer (Stories)

---
Summary: E1 Stories as articles, showreels, podcasts  
Issue Type: Story  
Priority: P2  
Description: Story builder and exports are missing.  
Acceptance Criteria:
- Story builder UI with narrative sections.
- Showreel generator with captions.
- Podcast generator from transcripts.
- Slide export with evidence links.

---
Summary: E1 Media exports (showreel/podcast/slide)  
Issue Type: Story  
Priority: P2  
Description: No media exports in activation layer.  
Acceptance Criteria:
- Showreel generator with captions.
- Podcast generator from transcripts.
- Slide export with evidence links.

---
Summary: E2 Stakeholder portal and decision tracking  
Issue Type: Story  
Priority: P2  
Description: Need read-only stakeholder view + metrics.  
Acceptance Criteria:
- Stakeholder portal with SSO/share links.
- Activation metrics for views/shares/decisions.
- Decision log tied to story and approver.

---
Summary: E2 Decision log and activation metrics  
Issue Type: Story  
Priority: P2  
Description: Decisions and activation metrics are not tracked.  
Acceptance Criteria:
- Decision log tied to story and approver.
- Metrics for views/shares/decisions.

## EPIC F: Delivery management and governance

---
Summary: F1 Review and approval workflow UX  
Issue Type: Story  
Priority: P1  
Description: Review UI incomplete.  
Acceptance Criteria:
- Review queue (draft/in review/approved/rejected).
- Inline comments on insights and stories.
- Approval gates block exports until approved.

---
Summary: F1 Inline review comments + export gate  
Issue Type: Story  
Priority: P1  
Description: Comments and export blocking are not enforced.  
Acceptance Criteria:
- Inline comments on insights and stories.
- Exports blocked until approvals complete.

---
Summary: F2 Audit is immutable and comprehensive  
Issue Type: Story  
Priority: P1  
Description: Expand audit guarantees.  
Acceptance Criteria:
- All mutations record before/after hashes.
- Export includes integrity metadata.
- Retention rules apply with explicit allow flag.

---
Summary: F2 Audit before/after capture enforcement  
Issue Type: Story  
Priority: P1  
Description: Before/after capture not enforced for all mutations.  
Acceptance Criteria:
- Every mutation records before/after hashes.

---
Summary: F3 Data retention and legal holds  
Issue Type: Story  
Priority: P2  
Description: Add legal hold and preview.  
Acceptance Criteria:
- Workspace retention applies to DB + object storage.
- Legal hold tags prevent deletion.
- Admin preview reports deletions before execution.

---
Summary: F3 Legal holds beyond media artifacts  
Issue Type: Story  
Priority: P2  
Description: Legal holds only cover media artifacts.  
Acceptance Criteria:
- Legal hold tags for DB and storage objects.
- Preview report before execution.

## EPIC G: Web UX overhaul

---
Summary: G1 Guided study wizard  
Issue Type: Story  
Priority: P1  
Description: Replace the current all-in-one Studies page.  
Acceptance Criteria:
- Step-by-step setup: objective, segments, markets, language, mode.
- Guide builder: brief → preview → edit → versioning.
- Recruit: screening, quotas, quality checks.
- Run: session monitoring.
- Analyze: themes, insights, evidence coverage.
- Activate: stories, exports, sharing.

---
Summary: G2 Evidence-first insight workbench  
Issue Type: Story  
Priority: P1  
Description: Provide evidence-driven insight workflow.  
Acceptance Criteria:
- Filtered insights list by theme/segment/confidence/status.
- Evidence viewer with attach flow.
- Convert insight to story block.

---
Summary: G2 Evidence viewer polish  
Issue Type: Story  
Priority: P1  
Description: Workbench lacks timeline and jump-to-quote.  
Acceptance Criteria:
- Evidence viewer with timeline and jump-to-quote.
- One-click convert insight to story block.

---
Summary: G3 Admin console
Issue Type: Story
Priority: P2
Description: Workspace-level admin tooling.
Acceptance Criteria:
- SSO config, retention, PII controls.
- Role assignment and access reviews.
- Token revocation management UI.

## EPIC H: Infrastructure and hosting

---
Summary: H1 Production Kubernetes cluster and networking
Issue Type: Story
Priority: P1
Description: No production hosting exists. The app runs locally only.
Acceptance Criteria:
- Kubernetes cluster provisioned with private node groups.
- VPC with private subnets for compute and data services.
- Public subnets for load balancer only.
- Security groups restrict Postgres, Redis, and OpenSearch to cluster only.
- Namespaces created for staging and production.
- Ingress controller and cert manager installed.

---
Summary: H2 Edge layer: CDN, WAF, TLS, and load balancer
Issue Type: Story
Priority: P1
Description: No CDN, WAF, or TLS termination is configured.
Acceptance Criteria:
- Domain registered with DNS pointing to load balancer.
- TLS certificates issued via automated certificate manager.
- HTTP redirects to HTTPS enforced.
- CDN caches static assets.
- WAF blocks common attacks and enforces rate limits.
- Request size limits applied for media upload routes.

---
Summary: H3 Managed data services provisioning
Issue Type: Story
Priority: P1
Description: Local Docker services must be replaced by managed equivalents for production.
Acceptance Criteria:
- Managed Postgres with point-in-time recovery enabled.
- Managed Redis with TLS and persistence.
- Managed OpenSearch with snapshots enabled.
- Object storage buckets for raw and derived media artifacts.
- Bucket lifecycle and versioning policies configured.
- All data services unreachable from public internet.

---
Summary: H4 Workload identity and least-privilege service accounts
Issue Type: Story
Priority: P1
Description: Services currently use shared credentials with no workload identity.
Acceptance Criteria:
- Workload identity or service account tokens used for cluster-to-service auth.
- Worker restricted to only the internal API endpoints it needs.
- No credentials stored in container images or config maps.
- Secrets manager integration provides all runtime secrets.

---
Summary: H5 Enterprise single-tenant Docker Compose stack
Issue Type: Story
Priority: P2
Description: Enterprise customers requiring full isolation have no supported deployment option.
Acceptance Criteria:
- Docker Compose stack packages web, api, worker, Postgres, Redis, OpenSearch, and MinIO.
- Fronted by a reverse proxy with TLS and WAF.
- Tenant-specific runbook covers backups, upgrades, and patching.
- SLA targets documented per customer tier.

## EPIC I: CI/CD pipeline

---
Summary: I1 CI build pipeline
Issue Type: Story
Priority: P1
Description: No automated CI pipeline runs tests, lint, or container builds on merge.
Acceptance Criteria:
- On merge to main: run lint, typecheck, and all tests.
- Build container images for web, api, and worker.
- Run dependency and container vulnerability scans.
- Push images to private container registry.
- Pipeline fails and blocks merge if any step fails.

---
Summary: I2 GitOps deployment pipeline with Prisma migrations
Issue Type: Story
Priority: P1
Description: No automated deployment pipeline exists.
Acceptance Criteria:
- GitOps repo with environment overlays for staging and production.
- Staging deployed automatically on merge to main.
- Production promoted via tagged releases only.
- Prisma migrations run as a controlled pre-deploy job.
- Canary deployment supported for api and web with rollback.
- Separate databases and object storage per environment.

## EPIC J: Observability

---
Summary: J1 OpenTelemetry, metrics, and dashboards
Issue Type: Story
Priority: P1
Description: No production observability exists. There are no traces, metrics, or dashboards.
Acceptance Criteria:
- OpenTelemetry collector deployed and receiving traces from api and worker.
- Prometheus scrapes metrics from all services.
- Grafana dashboards cover: API request rate, latency percentiles, error rate, worker throughput, queue lag, job failure rate, transcription and redaction job durations, OpenSearch query latency, object storage error rate, database connections and slow queries.
- Log pipeline configured (Loki or cloud log service).

---
Summary: J2 Alerting and SLO definitions
Issue Type: Story
Priority: P1
Description: No alerts or SLOs are defined.
Acceptance Criteria:
- Alerts fire for: API error rate above threshold, queue lag above threshold, job failures above threshold, disk or memory pressure, search cluster health not green, database connection saturation.
- SLOs defined and tracked for: researcher console availability, participant session submission success rate, time from session complete to transcript ready, time from transcript ready to first insights produced.
- On-call runbook references alert conditions and resolution steps.

## EPIC K: Backups and disaster recovery

---
Summary: K1 Postgres backups and point-in-time recovery
Issue Type: Story
Priority: P1
Description: No backup or restore process is defined for the database.
Acceptance Criteria:
- Daily full backups plus point-in-time recovery enabled.
- Restore tested in staging on a quarterly cadence.
- RPO and RTO targets documented per customer tier.
- Restore runbook executable by engineers without additional clarification.

---
Summary: K2 Object storage versioning, lifecycle, and replication
Issue Type: Story
Priority: P1
Description: Object storage has no versioning, lifecycle rules, or cross-region replication.
Acceptance Criteria:
- Versioning enabled on all media and artifact buckets.
- Lifecycle rules expire stale derived artifacts aligned to retention policy.
- Optional cross-region replication for enterprise tier.
- Deleted objects produce an audit record.

---
Summary: K3 OpenSearch snapshots and restore runbook
Issue Type: Story
Priority: P2
Description: OpenSearch index data is not backed up.
Acceptance Criteria:
- Snapshot repository configured with scheduled snapshots.
- Restore runbook verified in staging.
- Full rebuild runbook covers restoring data and reindexing search from scratch.
