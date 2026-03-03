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
