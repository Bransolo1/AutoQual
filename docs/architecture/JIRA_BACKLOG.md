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

## EPIC L: Study builder UX (researcher experience)

The study wizard exists as a 7-step form backed by raw JSON editing. These tickets replace raw JSON inputs with purpose-built UIs and complete the researcher workflow end to end.

---
Summary: L1 Visual guide builder replacing raw JSON editor
Issue Type: Story
Priority: P1
Description: The current guide builder on Step 3 requires researchers to type or paste raw JSON to define sections, questions, and probes. This is unusable for non-technical researchers.
Acceptance Criteria:
- Researcher can add, reorder, and delete sections via drag-and-drop.
- Within each section, researcher can add, reorder, and delete questions with a plain-text editor.
- Each question supports an optional probe field (follow-up hint for the AI moderator).
- Stop conditions (max turns, min coverage) set via numeric inputs, not JSON.
- The guide generates a validated JSON structure that the API accepts unchanged.
- Brief-to-guide AI generation renders into the visual editor rather than a raw text area.
- Guide versioning is preserved: saving creates a new version with a timestamp and author.

---
Summary: L2 Researcher wizard UX polish and validation
Issue Type: Story
Priority: P1
Description: The wizard currently requires researchers to type workspace and project UUIDs manually. Steps lack validation, and required prerequisites are not enforced.
Acceptance Criteria:
- Workspace and project are selected from dropdown lists, not typed as IDs.
- Study name validates on blur and blocks advancement if empty.
- Advancing to the Guide step is blocked until a study has been created.
- Advancing to the Recruitment step is blocked until a guide has been saved.
- Advancing to the Run step is blocked until recruitment setup is complete.
- Step completion indicators show clearly which steps are done.
- Wizard state persists across page reloads (already uses localStorage; must survive study ID changes).

---
Summary: L3 Visual recruitment setup builder
Issue Type: Story
Priority: P1
Description: Screening logic and quota targets are configured by editing JSON objects directly. Researchers cannot be expected to write JSON for screening rules.
Acceptance Criteria:
- Screening logic editor provides an if/then rule builder: attribute, operator, value, action (screen in/out).
- Quota targets editor lists each segment with a numeric input for the target count.
- Remaining quota is shown live against actual participant counts from the API.
- Researcher can add, edit, and remove screening rules without touching JSON.
- Localization checklist items are shown as labelled checkboxes, not JSON keys.
- Underlying data is still stored and submitted as the existing JSON schema.

---
Summary: L4 Live session monitoring dashboard
Issue Type: Story
Priority: P1
Description: The Run step shows only quota totals fetched on demand. Researchers have no live view of who is in-session, which sessions are at risk, or what the interview moderator is producing.
Acceptance Criteria:
- Dashboard lists active and recently completed sessions with status (in-progress, submitted, failed, abandoned).
- For each session: participant segment, elapsed time, current question index, consent status.
- Quota progress bars per segment update automatically on a polling interval.
- Researcher can flag or terminate a session from the dashboard.
- Session detail view shows the conversation turns that have occurred so far.

---
Summary: L5 Moderator configuration panel in the study wizard
Issue Type: Story
Priority: P1
Description: There is no way for a researcher to configure how the AI moderator behaves for a specific study. System prompt, probing aggressiveness, and interview modality are not exposed in the wizard.
Acceptance Criteria:
- New step or section in the guide builder for Moderator settings.
- Researcher writes a freeform system prompt: persona, context, tone, any domain-specific instructions.
- Researcher sets a depth temperature from 1 (move on quickly) to 10 (dig deep until satisfied).
- Researcher selects the interview modality: voice, text, or participant choice.
- Researcher sets a sufficiency threshold: the minimum response quality score before the AI moves to the next question.
- Moderator settings are stored on the study's interviewGuide schema and passed to the orchestration engine at runtime.

## EPIC M: Participant end-to-end experience

The current participant flow (/participant and /interview) is a developer test harness that exposes raw controls, internal status messages, and JSON blobs. These tickets replace it with a polished, production-quality participant experience.

---
Summary: M1 Participant onboarding and screening flow
Issue Type: Story
Priority: P1
Description: The participant welcome page is a static card with a single Start Interview link. There is no study context, no screening, and no device setup guide before the interview begins.
Acceptance Criteria:
- Participant arrives via a study-specific link containing a one-time token.
- Welcome screen shows study title and a plain-language description of what the interview covers and how long it takes.
- Consent screen presents the full consent text from the study configuration with an explicit I agree checkbox. Participant cannot proceed without consenting.
- Screening questionnaire dynamically presents required screening questions from the study's screening logic.
- If the participant is screened out, they see a polite disqualification message. Session is marked disqualified.
- If the participant passes screening, they proceed to a device check.
- Device check confirms camera (if video mode) and microphone work before any recording begins.
- Each step shows a clear progress indicator so participants know where they are.

---
Summary: M2 Polished participant interview UI (text chat mode)
Issue Type: Story
Priority: P1
Description: The interview page is a developer tool with upload buttons, multipart controls, and raw JSON status strings. Text chat mode needs a clean conversational interface.
Acceptance Criteria:
- Chat interface shows one AI question at a time in a bubble layout.
- Participant types a response in a text input and submits.
- After submission, the AI moderator generates the next question (or a probe if the answer is insufficient).
- Progress indicator shows how many questions remain, without revealing the exact count.
- Participant can edit or retract their last response before the moderator advances.
- No developer controls, status strings, or JSON are visible.
- Session is saved turn-by-turn so a browser refresh does not lose progress.

---
Summary: M3 Polished participant interview UI (voice mode)
Issue Type: Story
Priority: P1
Description: Voice mode requires a real-time speak-then-listen experience, not a manual record / stop / upload cycle. The current implementation is a developer harness.
Acceptance Criteria:
- Participant sees a visual speaking indicator (waveform or pulse) while the AI moderator plays the next question via text-to-speech.
- After the question ends, the participant's microphone activates with a clear recording indicator.
- Silence detection or a manual Stop button ends the participant's turn.
- Participant audio is transcribed in real time or near-real time.
- Transcribed text is shown back to the participant so they can verify accuracy before submitting.
- AI moderator generates and plays the next question or probe after processing the response.
- Participant can pause, re-record the current turn, or request the question be repeated.
- No raw upload buttons, multipart controls, or technical status messages are shown.

---
Summary: M4 Participant depth preference control
Issue Type: Story
Priority: P1
Description: The researcher sets a default depth temperature for the study, but some participants may want a quicker or more reflective conversation. Exposing this as a participant-facing preference increases data quality and participant satisfaction.
Acceptance Criteria:
- Before the interview begins (after device check), participant sees a brief explanation of conversation depth and a simple control: Quick (I will give short answers and move on), Balanced (default), or Reflective (I am happy to explore in depth).
- The participant's selection adjusts the effective depth temperature within bounds the researcher has configured.
- If the researcher disables participant override, this screen is skipped.
- The participant's selection is stored on the session and included in the analysis context.

---
Summary: M5 Session completion and thank-you flow
Issue Type: Story
Priority: P1
Description: There is no completion screen. After the last question the participant has no confirmation that the interview is done.
Acceptance Criteria:
- After all questions are answered (or max turns reached), participant sees a thank-you screen.
- Screen confirms the session has been submitted and explains what happens next.
- If the study is configured with an incentive, screen shows incentive instructions (e.g. redemption code or next steps).
- Participant can optionally leave a brief feedback note about the interview experience.
- Embed token is marked complete and the parent window receives the sensehub.embed.completed postMessage.
- Participant cannot re-enter the session using the same token after completion.

---
Summary: M6 Session resume and progress persistence
Issue Type: Story
Priority: P2
Description: If a participant closes the browser mid-interview, they currently lose their session state and cannot resume.
Acceptance Criteria:
- When a participant re-opens their study link, the system detects an existing in-progress session for that token.
- Participant is offered the choice to resume where they left off or start over.
- Resuming restores the completed turns and picks up from the next unanswered question.
- Starting over creates a new session and marks the previous one as abandoned.
- Session expiry is configurable per study (e.g. 24 hours after creation).

## EPIC N: LLM orchestration and agentic interview engine

The current moderator is purely rule-based: it selects the next static question from the guide by index. It does not call an LLM, does not evaluate answer quality, and does not adapt. These tickets build the real agentic interview engine.

---
Summary: N1 LLM-powered moderator with study system prompt
Issue Type: Story
Priority: P1
Description: The moderator service selects the next question by array index using a hard-coded helper function. It never calls an LLM. The system prompt written by the researcher is never used.
Acceptance Criteria:
- Moderator service calls the configured AI provider (OpenAI or Anthropic) for each turn.
- The system prompt is assembled from: the study-level system prompt the researcher wrote, the interview guide (sections, questions, probes, stop conditions), the current question being explored, the full conversation history so far, and the participant's depth temperature setting.
- The LLM response is the interviewer's next utterance: a question, a probe, a follow-up, or a transition.
- The LLM is instructed to stay within the guide structure and not invent off-topic questions.
- Raw LLM responses are validated against an expected schema (must be a question or transition string, not a JSON blob or freeform essay).
- Reasoning log records which guide question was being explored, the LLM's output, and the provider used.
- Fallback to the static rule-based selector if the LLM call fails or times out.

---
Summary: N2 Answer sufficiency evaluator
Issue Type: Story
Priority: P1
Description: The moderator currently moves to the next question after every participant turn regardless of response quality. If a participant gives a one-word answer the interviewer still advances.
Acceptance Criteria:
- After each participant turn, a sufficiency sub-call evaluates whether the response adequately addresses the current question.
- Sufficiency evaluator returns a score from 0.0 to 1.0 and a short reason string.
- The threshold for sufficiency is set per study by the researcher (default 0.7).
- If the score is below the threshold, the moderator generates a probe (follow-up question) rather than advancing to the next guide question.
- Maximum probe attempts per question is configurable (default 2) to prevent the moderator from looping.
- Sufficiency score, reason, and probe count are stored in the session turn record for analysis.
- Probes are contextually generated by the LLM, not drawn from a static probe field, though the static probe field is provided as a hint.

---
Summary: N3 Depth temperature parameter in the orchestration engine
Issue Type: Story
Priority: P1
Description: There is no depth temperature concept anywhere in the codebase. The researcher and participant controls defined in L5 and M4 need a corresponding engine implementation.
Acceptance Criteria:
- Depth temperature (1–10) is passed to the moderator engine at the start of each session.
- Temperature controls three engine behaviours: the sufficiency threshold (higher temperature → higher threshold → more probing), the maximum probe attempts per question (higher temperature → more retries before advancing), and the system prompt instruction for conversational style (higher temperature → more curious, exploratory tone instruction appended to the system prompt).
- A temperature of 1 behaves like: threshold 0.4, max probes 0, style instruction "Keep the conversation brisk and move forward after one brief follow-up at most."
- A temperature of 10 behaves like: threshold 0.85, max probes 4, style instruction "Explore thoroughly. Follow each answer with genuine curiosity. Do not advance until the participant has shared their reasoning and feelings in depth."
- Intermediate values interpolate linearly.
- Temperature and its derived parameters are logged in the session reasoning log for QA.

---
Summary: N4 Voice pipeline: speech-to-text and text-to-speech integration
Issue Type: Story
Priority: P1
Description: Voice mode in the interview UI requires real-time transcription of participant speech and synthesis of moderator questions. Neither exists.
Acceptance Criteria:
- Participant audio is streamed or sent in chunks to a speech-to-text provider (configurable: Whisper, Deepgram, or equivalent).
- Transcription result is returned with word-level timestamps and a confidence score.
- Low-confidence segments are flagged for participant review before submission.
- Moderator questions are passed to a text-to-speech provider to generate audio played in the browser.
- TTS voice is configurable per study (language, gender, tone).
- End-to-end latency target: participant stops speaking → AI starts responding → under 2 seconds for p50 sessions.
- Voice pipeline errors (STT failure, TTS failure) fall back gracefully: STT failure → participant can type instead; TTS failure → question is displayed as text.
- Audio chunks and transcription artifacts are stored in object storage under the session.

---
Summary: N5 Conversation state machine and guide coverage tracker
Issue Type: Story
Priority: P1
Description: The moderator tracks position in the guide by simple array index. If the LLM probes or the participant goes off-topic, the index drifts and questions are skipped or repeated.
Acceptance Criteria:
- A conversation state machine tracks the status of each guide question: not started, in progress, sufficiently answered, skipped.
- The LLM is given the full state on each turn so it can reference coverage in its reasoning.
- When a participant volunteers an answer to a future question mid-conversation, the engine marks that question as partially covered.
- The engine chooses the next question to explore based on coverage state and guide order, not a linear index.
- At the end of the session a coverage report is generated: which questions were answered, their sufficiency scores, and which were skipped and why.
- Coverage report is stored on the session and surfaced in the researcher's session monitoring dashboard (L4).

---
Summary: N6 Provider-agnostic LLM adapter with fallback chain
Issue Type: Story
Priority: P2
Description: The AI adapter currently has a mock implementation. The moderator service imports the adapter but does not make real LLM calls. For production the engine must support multiple providers and tolerate failures.
Acceptance Criteria:
- AI adapter interface supports: generate (single completion), stream (streaming completion), and score (classification/scoring sub-call for sufficiency).
- Concrete adapters for Anthropic (Claude) and OpenAI (GPT-4o class).
- Each study can be configured with a preferred provider and a fallback provider.
- If the primary provider fails or times out, the engine retries once then falls back to the secondary provider.
- Token usage, latency, provider used, and model version are logged per turn.
- Cost estimation is included in the session record for workspace-level usage reporting.

---

## EPIC O: Replace hardcoded demo headers across all web pages

> **BLOCKER for customer launch.** 30 pages pass `x-workspace-id: demo-workspace-id` and `x-user-id: demo-user` as static headers. All API calls will return 401 in production because the AuthGuard requires a real JWT Bearer token. Every page in this epic needs to be wired to the real session token from `lib/session.ts`.

---
Summary: O1 Create shared API client hook and server-component fetch helper
Issue Type: Story
Priority: P0
Story Points: 3
Description: A centralised helper is needed so every page can make authenticated API calls without reimplementing auth. Two variants needed: (a) a server-side fetch helper that reads the session cookie via `bearerHeader()` from `lib/session.ts`, and (b) a client-side `useApi` hook that reads the JWT from a hydrated context and attaches `Authorization: Bearer <token>`.
Acceptance Criteria:
- `lib/api.ts` exports `apiFetch(path, options)` for use in server components; automatically attaches `Authorization: Bearer <token>` if a session exists.
- `lib/useApi.ts` exports `useApi()` hook for client components; reads token from a React context populated during SSR.
- Neither helper hard-codes workspace or user IDs; both are derived from the decoded JWT claims.
- All existing pages that import `HEADERS` with `demo-workspace-id` are migrated to use one of these helpers.
- If the server fetch returns 401, the server component redirects to `/auth/login?returnTo=<current-path>`.

---
Summary: O2 Migrate server-component pages to real auth (projects, studies, insights, search, notifications, reports, stories, reviews, approvals, audit, evidence)
Issue Type: Story
Priority: P0
Story Points: 5
Description: The following server-component pages use hardcoded demo headers and must be migrated to `apiFetch` from O1: `/projects`, `/projects/[id]`, `/studies`, `/insights`, `/insights/[id]`, `/search`, `/notifications`, `/reports`, `/stories`, `/reviews`, `/approvals`, `/audit`, `/evidence`.
Acceptance Criteria:
- All listed pages use `apiFetch` with the real Bearer token.
- Demo header constants (`HEADERS`, `WORKSPACE_ID`, `USER_ID`) are removed from all migrated files.
- Pages redirect to login if the session is absent or expired.
- Workspace ID is derived from the session token claims, not from a hard-coded string.

---
Summary: O3 Migrate client-component pages to real auth (settings, ops, interview, embed-test, stakeholder, client portal)
Issue Type: Story
Priority: P0
Story Points: 5
Description: The following client components use hardcoded demo headers and must be migrated to `useApi` from O1: `/settings`, `/ops`, `/ops/alerts`, `/ops/blocked`, `/ops/overdue`, `/ops/recruitment`, `/interview`, `/embed-test`, `/stakeholder`, `/client`, `/client/approvals`, `/client/approvals/[id]`, `/client/reports`, `/client/insights/[id]`, `/client/audit`.
Acceptance Criteria:
- All listed pages use the `useApi` hook.
- No page references `demo-workspace-id` or `demo-user` at runtime.
- Client portal pages (`/client/**`) enforce the `client` role; researcher portal pages enforce `researcher` or `admin`.
- Session expiry during an active client-component page shows a dismissable "Session expired – please sign in" banner before redirecting.

---
Summary: O4 Remove demo workspace seed dependency
Issue Type: Story
Priority: P0
Story Points: 2
Description: The API's seed script and several test fixtures create a `demo-workspace-id` workspace. This workspace must not exist in production. New environments must start empty and require real workspace provisioning.
Acceptance Criteria:
- Seed script is clearly marked dev-only and cannot run when `NODE_ENV=production`.
- Any database fixtures referencing `demo-workspace-id` are confined to `*.test.*` files or explicitly namespaced test data.
- Production migration job does not execute the seed script.
- CI/CD uses a separate isolated test database and seed, not the production migration path.

---

## EPIC P: Workspace self-serve onboarding

> A new customer must be able to arrive at the product, create a workspace, and reach the dashboard in under 5 minutes without contacting sales or support.

---
Summary: P1 Workspace creation API endpoint and Prisma model
Issue Type: Story
Priority: P0
Story Points: 3
Description: There is no endpoint to create a new workspace. Workspaces are currently provisioned by hand (direct database insert or seed). A self-serve customer needs to create their own workspace on sign-up.
Acceptance Criteria:
- `POST /workspaces` endpoint creates a workspace with a unique slug and display name.
- The calling user is automatically assigned the `admin` role in the new workspace.
- Workspace names are validated: 3–64 chars, alphanumeric with spaces/hyphens, unique slug generated from name.
- Response includes `{ id, slug, name, createdAt }`.
- Endpoint is rate-limited to 3 workspace creations per user per hour.
- New workspace is provisioned with sensible defaults (retention: 365 days, PII redaction: enabled).

---
Summary: P2 Sign-up and workspace creation web flow
Issue Type: Story
Priority: P0
Story Points: 5
Description: After SSO callback, first-time users (no workspace membership) must be guided through creating or joining a workspace before reaching the dashboard.
Acceptance Criteria:
- After successful SSO login with no existing workspace, user is redirected to `/onboarding`.
- `/onboarding` page shows a two-step flow: (1) create workspace (name, optional logo); (2) confirm and land on dashboard.
- If user has been invited to an existing workspace (via invite token, epic Q1), the invitation is accepted here instead.
- After workspace is created, the JWT is refreshed to include the new `workspaceId` claim (or the API issues a workspace-scoped exchange token).
- Onboarding state is persisted so a refresh mid-flow does not lose data.
- Page is mobile-friendly.

---
Summary: P3 Workspace selector for users who belong to multiple workspaces
Issue Type: Story
Priority: P1
Story Points: 3
Description: Researchers at agencies or consultancies may belong to multiple workspaces. After login, they need to choose which workspace to enter. The current auth model assumes one workspace per token.
Acceptance Criteria:
- After SSO login, if the user belongs to more than one workspace, they are shown `/workspace-select`.
- Selecting a workspace triggers a workspace-scoped token exchange (`POST /auth/workspace-token?workspaceId=xxx`) and sets the session cookie with the scoped token.
- Workspace switcher is accessible from the nav (profile dropdown) without requiring re-login.
- Workspace context is shown in the header (workspace name/logo).

---
Summary: P4 Workspace settings page: name, logo, slug, retention, PII
Issue Type: Story
Priority: P1
Story Points: 3
Description: The current `/settings` page calls the API with demo headers. It needs to be a real settings page where workspace admins can update workspace metadata and policy settings.
Acceptance Criteria:
- Workspace name, slug, and optional logo (uploaded to S3 and displayed in nav) are editable by `admin` role only.
- Retention days, PII redaction, and encryption-at-rest flags are shown and editable (admin only).
- Changes are confirmed with a success toast.
- Changes outside the authenticated user's workspace are rejected by the API.
- Non-admin users see settings as read-only.

---

## EPIC Q: Team management and user invitations

---
Summary: Q1 User invitation API
Issue Type: Story
Priority: P0
Story Points: 5
Description: There is no way to invite team members to a workspace. Admins must manually create users in the database. For customer-facing launch, admins need to invite by email.
Acceptance Criteria:
- `POST /workspaces/:workspaceId/invitations` accepts `{ email, role }` and creates a time-limited signed invitation token (24-hour expiry).
- Invitation record is stored in a new `WorkspaceInvitation` Prisma model with `status: pending|accepted|expired|revoked`.
- Invitation email is sent via the email service (epic S1) with an accept link.
- `POST /workspaces/:workspaceId/invitations/:token/accept` validates the token and provisions the user.
- `GET /workspaces/:workspaceId/invitations` lists pending invitations (admin only).
- `DELETE /workspaces/:workspaceId/invitations/:id` revokes an invitation.
- Invitations cannot be used more than once.

---
Summary: Q2 Team members settings page
Issue Type: Story
Priority: P1
Story Points: 3
Description: Admins need a UI to manage team members: view who is in the workspace, invite new members, update roles, and remove members.
Acceptance Criteria:
- `/settings/team` page lists all workspace members with name, email, role, and joined date.
- Invite form sends an invitation (calls Q1 API).
- Role dropdown changes a member's role (admin/researcher/client) via `PATCH /users/:id/roles`.
- Remove button removes the user from the workspace (not deletes the user account).
- Admins cannot remove themselves if they are the last admin.
- Page is only visible to `admin` role; researchers and clients are redirected.

---
Summary: Q3 Accept invitation landing page
Issue Type: Story
Priority: P1
Story Points: 2
Description: Invited users need a landing page that accepts the invitation token and either initiates SSO or confirms account creation.
Acceptance Criteria:
- `/invite/:token` page validates the token (calls API; shows error if expired/invalid).
- If the invited user is not logged in, the page shows an SSO login button pre-filled with their email.
- After login, the invitation is accepted automatically and the user lands on the workspace dashboard.
- If the user is already logged in with a different workspace, they are prompted to switch.

---
Summary: Q4 User profile page
Issue Type: Story
Priority: P2
Story Points: 2
Description: Users need to view and update their own profile (display name, avatar).
Acceptance Criteria:
- `/settings/profile` shows current user's name, email (read-only, from IdP), and avatar.
- Display name is editable and saved to the `User` model.
- Avatar can be uploaded (max 2MB JPEG/PNG); stored in S3; displayed in nav.
- Profile changes do not require re-login.

---

## EPIC R: Billing and subscription

> Billing is required before any customer pays. The recommended approach is Stripe. Free alternative: keep billing out of the product and handle it manually (invoice + env flag to enable/disable workspace) for the first 10 customers.

---
Summary: R1 Workspace billing status flag and enforcement
Issue Type: Story
Priority: P1
Story Points: 3
Description: Before full Stripe integration, workspaces need a billing status flag that can be set by an operator. When `billingStatus=suspended`, the workspace is locked to read-only and users see a banner.
Acceptance Criteria:
- `Workspace` model gains `billingStatus: active | trialing | suspended | cancelled` (default: `trialing`).
- New `trialEndsAt: DateTime?` field; trial defaults to 14 days from workspace creation.
- API returns HTTP 402 for mutating operations when `billingStatus=suspended`.
- Web app shows a non-dismissable banner: "Your trial has ended. Contact us to continue." when suspended.
- Operator endpoint `PATCH /ops/workspaces/:id/billing-status` (admin role required) sets billing status.

---
Summary: R2 Stripe customer and subscription creation
Issue Type: Story
Priority: P1
Story Points: 8
Description: Integrate Stripe Checkout for workspace subscription management. Free alternative: skip and use R1 manual flag only.
Acceptance Criteria:
- `POST /billing/checkout-session` creates a Stripe Checkout Session for the workspace's subscription.
- Stripe webhook handler (`POST /billing/webhook`) processes `checkout.session.completed`, `invoice.payment_failed`, `customer.subscription.deleted`.
- On `checkout.session.completed`: set `billingStatus=active`, store `stripeCustomerId` and `stripeSubscriptionId` on Workspace.
- On `invoice.payment_failed`: set `billingStatus=suspended` after grace period.
- On `customer.subscription.deleted`: set `billingStatus=cancelled`.
- Stripe webhook signature is verified (prevents spoofing).
- `/settings/billing` page shows current plan, next billing date, and a "Manage billing" link (Stripe Customer Portal).
- Stripe keys are stored as secrets; never logged.

---
Summary: R3 Usage limits and quota enforcement
Issue Type: Story
Priority: P2
Story Points: 5
Description: Plans need limits (seats, sessions per month, storage GB). Quota enforcement prevents abuse and ties to billing tier.
Acceptance Criteria:
- `WorkspaceQuota` model stores plan limits: `maxSeats`, `maxSessionsPerMonth`, `maxStorageGb`.
- API enforces quotas: creating a new user errors with 402 when `maxSeats` exceeded; starting a session errors when `maxSessionsPerMonth` exceeded.
- Quota usage is surfaced in `/settings/billing` as a usage bar.
- Operators can override quotas for enterprise accounts.

---

## EPIC S: Transactional email

---
Summary: S1 Email service integration (Resend or SendGrid)
Issue Type: Story
Priority: P0
Story Points: 3
Description: No transactional email exists. Invitations (Q1), password resets, session notifications, and digest emails all require an email sending service. Recommended: Resend (generous free tier). Alternative: SendGrid (also free tier).
Acceptance Criteria:
- `packages/email` package wraps the email provider SDK with a simple `sendEmail({ to, subject, html })` interface.
- Provider is configurable via `EMAIL_PROVIDER=resend|sendgrid|log` env var; `log` mode prints to stdout for dev/test.
- API key stored as a secret; never logged.
- All outbound emails use the workspace's configured `fromEmail` or fall back to the platform default.
- Email sends are retried up to 3 times via BullMQ job; failures are recorded in `AuditEvent`.
- `EMAIL_FROM` and `EMAIL_REPLY_TO` env vars configure defaults.

---
Summary: S2 Workspace invitation email
Issue Type: Story
Priority: P0
Story Points: 2
Description: When an admin invites a team member (Q1), an email must be sent with the invitation link.
Acceptance Criteria:
- Email subject: "You've been invited to [WorkspaceName] on Sensehub"
- Body includes: inviting admin's name, workspace name, role being granted, accept link (expires in 24h), and a plain-text fallback URL.
- Email is sent asynchronously via BullMQ; failures do not block the API response.
- Invitation email is re-sendable from the team management page.
- Unsubscribe link is present per CAN-SPAM/GDPR (links to preferences or one-click unsubscribe).

---
Summary: S3 Welcome email on first workspace login
Issue Type: Story
Priority: P1
Story Points: 2
Description: First-time users (no prior login) should receive a welcome email after they create or join a workspace.
Acceptance Criteria:
- Welcome email sent on first successful login (tracked by `User.lastLoginAt IS NULL` before this login).
- Subject: "Welcome to Sensehub – here's how to get started"
- Body: 3-step quick-start guide (create a project, run a study, review insights), links to help docs.
- Sent within 60 seconds of login.

---
Summary: S4 Session completion and insight ready notifications
Issue Type: Story
Priority: P2
Story Points: 3
Description: Researchers need email alerts when a session completes transcription and when AI insights are ready for review. Currently notifications exist in-app only.
Acceptance Criteria:
- When a `Session` transitions to `complete` and transcription is done, send an email to the assigned researcher.
- When an `Insight` is ready for review (status changes to `pending_review`), send an email to the reviewer.
- Both emails are controlled by per-user notification preferences (`UserNotificationPreferences` model).
- Users can unsubscribe from individual notification types from `/settings/notifications`.
- Email digest mode: option to batch notifications into a daily summary instead of individual emails.

---

## EPIC T: Product polish — error pages, empty states, loading states, toasts

> Without these, the product looks unfinished and customers lose trust. These are table-stakes for GA.

---
Summary: T1 Global error pages (404, 500, 403, maintenance)
Issue Type: Story
Priority: P0
Story Points: 2
Description: Next.js serves its default error pages. Customers see a generic white page on errors.
Acceptance Criteria:
- `app/not-found.tsx` implements a branded 404 page with a "Go home" link and search bar.
- `app/error.tsx` implements a branded 500 page with "Try again" and "Contact support" links.
- `app/global-error.tsx` handles unrecoverable errors at the root layout level.
- A static `app/maintenance/page.tsx` page exists for planned downtime; deployable via feature flag or DNS redirect.
- All error pages preserve the navigation header so users aren't stranded.

---
Summary: T2 Empty states for all data-heavy pages
Issue Type: Story
Priority: P1
Story Points: 5
Description: When a new workspace has no projects, studies, insights, etc., pages render blank. Empty states guide users toward their first action.
Acceptance Criteria:
- Every list page (`/projects`, `/studies`, `/insights`, `/search`, `/notifications`, `/reports`, `/stories`, `/reviews`, `/approvals`) has an empty state component.
- Empty state shows: an icon, a headline (e.g. "No projects yet"), a one-line description, and a CTA button ("Create project").
- Empty states differ for "no data exists" vs "no results match your filter/search".
- Empty states are implemented as a shared `<EmptyState>` component in `components/`.

---
Summary: T3 Loading skeletons for list and detail pages
Issue Type: Story
Priority: P1
Story Points: 3
Description: All pages that fetch data show no loading indicator; they either flash blank or hang visibly.
Acceptance Criteria:
- Each page that fetches data exports a `loading.tsx` (Next.js App Router) that shows a skeleton matching the page layout.
- Skeleton uses pulse animation consistent with the brand design system.
- Shared skeleton primitives (`<SkeletonLine>`, `<SkeletonCard>`, `<SkeletonTable>`) extracted to `components/skeleton.tsx`.
- Time-to-interactive perception improves: skeleton appears within 100ms of navigation.

---
Summary: T4 Toast notification system
Issue Type: Story
Priority: P1
Story Points: 3
Description: User actions (creating a project, updating settings, accepting an invitation) have no feedback. Users don't know if their action succeeded.
Acceptance Criteria:
- A lightweight toast component (no paid library required; ~50 lines) is added to the root layout.
- Toast variants: success (green), error (red), info (blue), warning (amber).
- Toasts auto-dismiss after 5 seconds; dismissable by click.
- A `useToast()` hook is exposed from `lib/toast.tsx` for client components.
- Toast state is not persisted across navigation (intentional).
- All mutating actions in the web app trigger an appropriate toast.

---
Summary: T5 Confirm dialogs for destructive actions
Issue Type: Story
Priority: P1
Story Points: 2
Description: Destructive actions (delete project, archive study, revoke token, remove team member) have no confirmation step.
Acceptance Criteria:
- A shared `<ConfirmDialog>` component prompts: "[Action] cannot be undone. Type the name to confirm."
- Dialog is used for: delete project, delete study, remove team member, bulk archive, revoke API key.
- Pressing Escape or clicking outside the dialog cancels without acting.
- Confirm button is disabled until the required confirmation text is typed (for high-stakes deletions).

---

## EPIC U: Legal, compliance, and cookie consent

---
Summary: U1 Terms of Service and Privacy Policy pages
Issue Type: Story
Priority: P0
Story Points: 1
Description: The product has no ToS or Privacy Policy linked from the UI. This is a legal requirement before any external user accesses the system.
Acceptance Criteria:
- `/legal/terms` renders the Terms of Service (content to be supplied by legal team; a placeholder stub is acceptable for internal beta).
- `/legal/privacy` renders the Privacy Policy.
- Both pages are linked from: sign-in page footer, onboarding flow, and the main footer.
- Pages are excluded from the auth middleware (publicly accessible without login).
- Pages are statically rendered (no API calls).

---
Summary: U2 Cookie consent banner (GDPR / ePrivacy)
Issue Type: Story
Priority: P0
Story Points: 3
Description: The product sets session cookies and potentially analytics cookies without obtaining consent. This is non-compliant for EU users.
Acceptance Criteria:
- A consent banner appears on first visit for users in GDPR jurisdictions (or globally for simplicity).
- Banner offers: "Accept all", "Reject non-essential", "Manage preferences".
- Strictly necessary cookies (session cookie) are always set and not consent-gated.
- Analytics cookies (epic V) are only set after consent.
- Consent preference is stored in a `__consent` cookie (1-year expiry); banner does not re-appear after consent is given.
- Consent preferences are honoured; analytics are not loaded if rejected.
- Banner is WCAG 2.1 AA accessible (keyboard navigable, ARIA labelled).

---
Summary: U3 GDPR data subject request flow
Issue Type: Story
Priority: P1
Story Points: 5
Description: EU customers are required to support data subject rights: access, portability, erasure, and restriction. Currently no self-service mechanism exists.
Acceptance Criteria:
- `/settings/privacy` page allows users to:
  - Download their data (exports all records associated with their `sub` claim as JSON).
  - Request account deletion (creates a `DataDeletionRequest` with 30-day processing window).
- Workspace admins can submit deletion requests for participant data.
- `DataDeletionRequest` triggers a BullMQ job that anonymises or deletes PII per the configured retention policy.
- Deletion confirmation email is sent to the requestor.
- All requests are logged in `AuditEvent` with `action: data_deletion_request`.

---
Summary: U4 Content Security Policy (CSP) headers
Issue Type: Story
Priority: P1
Story Points: 2
Description: The web app has basic security headers (X-Frame-Options, X-Content-Type-Options) but no Content Security Policy. CSP prevents XSS by restricting script/style sources.
Acceptance Criteria:
- A strict CSP is added to `next.config.mjs` headers.
- Directives include: `default-src 'self'`, `script-src 'self' 'nonce-{NONCE}'`, `style-src 'self' 'unsafe-inline'` (acceptable for Tailwind until CSS-in-JS is used), `img-src 'self' data: blob:`, `media-src 'self' blob:`, `connect-src 'self' <API_URL>`.
- A nonce is generated per request and injected into Next.js via middleware.
- No `unsafe-eval` in production.
- CSP violations are reported to `/api/csp-report` (endpoint logs and discards).
- CSP is tested with a scanner (e.g. securityheaders.com) and achieves A grade.

---

## EPIC V: Customer-facing analytics and usage reporting

---
Summary: V1 Privacy-preserving product analytics
Issue Type: Story
Priority: P2
Story Points: 3
Description: No analytics exist. The team cannot see which features customers use or where they drop off. Recommended: Posthog (self-hostable, GDPR-friendly, free tier). Alternative: Plausible (privacy-first, EU-hosted, paid).
Acceptance Criteria:
- Analytics provider is integrated in the web app via a client component loaded only after cookie consent (U2).
- Tracked events: page view, login, workspace created, project created, study started, session completed, insight approved, export downloaded.
- No PII (names, emails, transcript content) is sent to the analytics provider.
- Workspace ID and role are sent as anonymous properties.
- Analytics provider API key is stored in a public env var (`NEXT_PUBLIC_ANALYTICS_KEY`).
- Analytics can be fully disabled by setting `NEXT_PUBLIC_ANALYTICS_KEY=` to empty.

---
Summary: V2 Workspace usage dashboard for admins
Issue Type: Story
Priority: P2
Story Points: 5
Description: Workspace admins have no view of how their team uses the product or where they are against quotas.
Acceptance Criteria:
- `/settings/usage` page shows (for the current month):
  - Sessions run vs quota (`maxSessionsPerMonth`).
  - Storage used vs quota (`maxStorageGb`).
  - Active seats vs quota (`maxSeats`).
  - Daily session chart (last 30 days).
  - Top 5 projects by session count.
- Data comes from a new `GET /workspaces/:id/usage` API endpoint.
- Page refreshes daily (SWR revalidation or static ISR with 1-hour TTL).
- Admins only; other roles see a 403 empty state.

---

## EPIC W: Customer help and support

---
Summary: W1 In-app help links and documentation
Issue Type: Story
Priority: P1
Story Points: 2
Description: There are no help links, tooltips, or documentation pointers anywhere in the product. Users hit dead ends with no guidance.
Acceptance Criteria:
- A "?" icon in the global header links to `/help` or an external documentation URL (configurable via `NEXT_PUBLIC_DOCS_URL` env var).
- Every major feature page has a "Learn more" link to the relevant documentation section.
- Empty states (T2) include a documentation link.
- A `<Tooltip>` component is available for explaining non-obvious fields or concepts.

---
Summary: W2 In-app support widget
Issue Type: Story
Priority: P2
Story Points: 3
Description: Customers need a way to contact support without leaving the product. Recommended: plain mailto link for beta. Upgrade to Intercom/Crisp for GA.
Acceptance Criteria:
- A "Support" button in the footer or help dropdown opens a contact modal.
- For beta: modal contains a mailto link pre-filled with workspace ID and user ID for context.
- For GA: integrates a live-chat widget (Intercom or Crisp) loaded after cookie consent.
- Support widget is not shown for client portal users (different support tier).

---
Summary: W3 Status page integration
Issue Type: Story
Priority: P2
Story Points: 1
Description: Customers need to check if the platform is down without contacting support. Recommended: Statuspage.io (free tier) or BetterUptime.
Acceptance Criteria:
- A status page is provisioned (Statuspage.io or equivalent).
- Login page and help widget link to the status page.
- When `platformStatus != operational`, a banner is shown on the login page.
- Status is checked via a public JSON endpoint (`NEXT_PUBLIC_STATUS_URL`).

---

## EPIC X: Accessibility and mobile

---
Summary: X1 WCAG 2.1 AA audit and remediation
Issue Type: Story
Priority: P1
Story Points: 8
Description: No accessibility audit has been performed. Enterprise customers (regulated industries, government) require WCAG 2.1 AA compliance.
Acceptance Criteria:
- An automated audit is run with axe-core on all major pages; zero critical violations.
- All interactive elements are keyboard navigable and have visible focus indicators.
- All images have `alt` text; all form inputs have associated `<label>` elements.
- Colour contrast ratios meet WCAG AA (4.5:1 for normal text, 3:1 for large text).
- Modals and dialogs trap focus and restore it on close.
- Screen reader testing performed on login, project creation, study launch, insight review flows.
- Accessibility statement published at `/legal/accessibility`.

---
Summary: X2 Mobile-responsive layout audit
Issue Type: Story
Priority: P2
Story Points: 5
Description: The product is used by researchers in fieldwork on tablets and phones. Current layout has not been tested at mobile breakpoints.
Acceptance Criteria:
- All pages render correctly at 375px (iPhone SE), 768px (iPad), and 1280px (desktop) viewport widths.
- Navigation collapses to a hamburger menu on mobile.
- Tables reformat to stacked cards or horizontal scroll on mobile.
- Media upload and video player work on iOS Safari and Android Chrome.
- Touch targets are a minimum of 44×44px.

---

## EPIC Y: Self-service SSO configuration

---
Summary: Y1 Admin SSO configuration UI
Issue Type: Story
Priority: P2
Story Points: 5
Description: Currently SSO is configured via environment variables set by an operator. Enterprise customers need to configure their own IdP (Okta, Azure AD, Google Workspace) through the product UI.
Acceptance Criteria:
- `/settings/sso` page allows workspace admins to configure OIDC: issuer URL, client ID, client secret, allowed domains, group-to-role mapping.
- Configuration is stored encrypted on the `Workspace` model (or a `WorkspaceSsoConfig` relation).
- A "Test connection" button verifies the OIDC discovery document is reachable and the credentials are valid before saving.
- Once SSO is configured for a workspace, only users matching the allowed domains can join.
- Admins can toggle "Require SSO" to prevent password-based login (if supported by IdP).
- SSO config changes are logged in `AuditEvent`.

---
Summary: Y2 SAML 2.0 support (enterprise tier)
Issue Type: Story
Priority: P3
Story Points: 13
Description: Large enterprises (banks, government, pharma) often mandate SAML 2.0 rather than OIDC.
Acceptance Criteria:
- API supports SAML 2.0 SP-initiated SSO using `node-saml` or `samlify`.
- SP metadata endpoint exposed at `/sso/saml/metadata`.
- SAML assertion attributes are mapped to the same `{ sub, workspaceId, role }` claims as OIDC.
- Admin UI allows uploading IdP metadata XML and configuring attribute mapping.
- SAML sessions support the same revocation and JTI mechanism as OIDC.

---

## EPIC Z: Operator tooling

---
Summary: Z1 Operator admin panel (internal)
Issue Type: Story
Priority: P1
Story Points: 5
Description: The operations team needs to manage workspaces, toggle billing flags, inspect audit logs, and impersonate users for support without direct database access.
Acceptance Criteria:
- `/ops/admin` page (guarded by `superadmin` role, not visible to regular admins) lists all workspaces.
- Operator can: suspend/reactivate a workspace, reset billing trial, trigger data deletion, view workspace audit logs.
- Impersonation: operator can generate a scoped short-lived token for any workspace to debug issues; impersonation is logged in `AuditEvent` with `action: operator_impersonation`.
- All operator actions require a second confirmation step.
- Operator panel is inaccessible to non-superadmin tokens; enforced at the API level.

---
Summary: Z2 Workspace provisioning API for sales/CS team
Issue Type: Story
Priority: P1
Story Points: 2
Description: The sales team needs to provision workspaces for new enterprise customers without asking engineering to run database scripts.
Acceptance Criteria:
- Internal API endpoint `POST /ops/workspaces` (superadmin role) provisions a workspace with custom slug, plan, and seat limit.
- Endpoint accepts an optional `ownerEmail` and sends them a welcome email directly into the workspace.
- Response includes the workspace ID, admin invite link, and a temporary setup URL.
- Endpoint is documented in the ops runbook.

