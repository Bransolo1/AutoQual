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
Summary: A3 Production search security posture  
Issue Type: Story  
Priority: P0  
Description: OpenSearch security is disabled in local config.  
Acceptance Criteria:
- Production enables OpenSearch security and TLS.
- API uses least-privilege credentials from secrets.
- Health checks and alerts cover search connectivity.

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
Summary: B3 Recruitment quality and fraud signals  
Issue Type: Story  
Priority: P1/P2  
Description: Add verification quality controls and quota enforcement.  
Acceptance Criteria:
- Device fingerprint and duplicate detection.
- Server-side screening logic execution.
- Quota enforcement blocks recruitment when full.
- Optional: external panel adapters (P2).

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
Summary: C2 Real transcription with word timestamps  
Issue Type: Story  
Priority: P1  
Description: Transcript creation is placeholder.  
Acceptance Criteria:
- Audio extraction + transcription with word timestamps.
- Store raw and redacted text + timing data.
- Optional diarization with confidence.

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
Summary: C4 PII detection and redaction upgrade  
Issue Type: Story  
Priority: P2  
Description: Regex-only redaction is insufficient.  
Acceptance Criteria:
- Entity detection for common PII classes.
- Store redaction offsets and metadata.
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
Summary: D2 Theme coding and clustering  
Issue Type: Story  
Priority: P1  
Description: Theme generation is placeholder.  
Acceptance Criteria:
- Stable theme taxonomy with insight mappings.
- Segment-aware theme analysis.
- UI filtering by theme.

---
Summary: D3 Retrieval and semantic search  
Issue Type: Story  
Priority: P2  
Description: Improve search experience.  
Acceptance Criteria:
- Index transcripts, insights, themes, story blocks.
- Semantic + keyword fallback.
- Evidence-aware results with snippets.

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
Summary: E2 Stakeholder portal and decision tracking  
Issue Type: Story  
Priority: P2  
Description: Need read-only stakeholder view + metrics.  
Acceptance Criteria:
- Stakeholder portal with SSO/share links.
- Activation metrics for views/shares/decisions.
- Decision log tied to story and approver.

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
Summary: F2 Audit is immutable and comprehensive  
Issue Type: Story  
Priority: P1  
Description: Expand audit guarantees.  
Acceptance Criteria:
- All mutations record before/after hashes.
- Export includes integrity metadata.
- Retention rules apply with explicit allow flag.

---
Summary: F3 Data retention and legal holds  
Issue Type: Story  
Priority: P2  
Description: Add legal hold and preview.  
Acceptance Criteria:
- Workspace retention applies to DB + object storage.
- Legal hold tags prevent deletion.
- Admin preview reports deletions before execution.

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
Summary: G3 Admin console  
Issue Type: Story  
Priority: P2  
Description: Workspace-level admin tooling.  
Acceptance Criteria:
- SSO config, retention, PII controls.
- Role assignment and access reviews.
- Token revocation management UI.
