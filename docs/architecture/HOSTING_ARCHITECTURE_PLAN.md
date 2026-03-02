# Hosting Architecture Plan for AutoQual as a Production Website

## Section 1 Objectives and non negotiables

1. The platform must be reachable as a normal website on a custom domain with TLS, with separate researcher and participant experiences.
2. Enterprise security baseline: OIDC SSO, signed token verification, RBAC, audit logging, least privilege service accounts, secrets manager.
3. Data controls: retention, legal hold, PII handling, and backups that cover both database and object storage.
4. Observability: metrics, traces, logs, and alerting tied to queue lag and job failures as first class signals.
5. Deployability: reproducible environments for dev, staging, prod, and an optional single tenant customer stack.

## Section 2 Target production topology

### 2.1 Public entry points

1. DNS: yourdomain.com
2. CDN: caches static assets and provides edge protection for the web app
3. WAF: blocks common attacks and enforces rate limits
4. Load balancer and ingress: routes requests to web and api

### 2.2 Application services

1. Web service: Next.js app serving researcher console plus participant interview routes
2. API service: NestJS service for all business logic and auth
3. Worker service: BullMQ consumers for transcription, redaction, insight generation, exports, retention, notifications
4. Optional realtime service: for live interview upload status and session monitoring, implemented via websocket gateway in the API or a separate gateway service

### 2.3 Data plane

1. Postgres: primary transactional datastore for workspaces, projects, studies, sessions, insights, approvals, audit
2. Redis: queues, job locks, and optionally rate limiting
3. OpenSearch: search across insights, stories, transcript snippets, tags, and optionally semantic vectors
4. Object storage: raw media, derived audio, thumbnails, clip segments, transcript artifacts, exports

### 2.4 Observability plane

1. OpenTelemetry collector: receives traces and metrics from api and worker
2. Metrics store: Prometheus
3. Dashboards and alerting: Grafana
4. Logs: centralized log store, either Loki or a cloud log service

## Section 3 Recommended hosting model

### Option A Managed cloud services plus Kubernetes for compute

This is the fastest path to stable production.

1. Compute
   Kubernetes cluster hosts three deployments: web, api, worker
   Separate namespaces for staging and prod
   Ingress controller terminates TLS or uses the load balancer for TLS

2. Managed data services
   Managed Postgres
   Managed Redis
   Managed OpenSearch
   Managed object storage

3. Security and networking
   Cluster nodes in private subnets
   Load balancer in public subnets
   Data services in private subnets with security group rules restricted to the cluster
   No direct public access to Postgres, Redis, OpenSearch
   Object storage private with presigned URL access

### Option B Single tenant per customer using Docker Compose like stack

This is viable for enterprise customers who demand full isolation.

1. One stack per customer environment
2. Same core services: web, api, worker, Postgres, Redis, OpenSearch, MinIO
3. Fronted by a reverse proxy with TLS and WAF
4. Requires stronger ops discipline: backups, upgrades, scaling, security patching

## Section 4 Request routing and user facing website setup

1. Domain and TLS
   Use a DNS provider to point your domain to the load balancer
   Issue certificates via an automated certificate manager
   Enforce TLS only, redirect HTTP to HTTPS

2. Routing rules
   Route / and all researcher routes to the web service
   Route /api to the api service
   Route participant interview routes such as /i/{sessionToken} to the web service, but ensure all writes go to the api
   Serve static assets via CDN

3. Session entry
   Participant links contain a one time session token scoped to a single study session
   Researcher access requires OIDC SSO login and role checks

## Section 5 Identity, access, and secrets

1. OIDC SSO
   Use authorization code flow
   Map IdP groups to application roles
   Issue short lived access tokens and rotate refresh tokens
   Store token ids for revocation

2. Service to service auth
   Use workload identity or service account tokens inside the cluster
   Restrict worker permissions so it can only call necessary internal endpoints

3. Secrets
   All secrets must come from a secrets manager
   No secrets in environment files committed to repo
   Rotate keys and database credentials via runbooks

## Section 6 Media and transcription pipeline for production

1. Upload path must be direct to object storage
   API issues presigned upload URLs
   Client uploads media directly to storage
   API records metadata and sets artifact state to uploaded

2. Processing path
   Worker detects new media artifact
   Worker transcodes if needed, extracts audio, creates thumbnails, stores derived files
   Worker triggers transcription job
   Worker stores transcript with word timestamps
   Worker triggers redaction job and produces redacted transcript plus redaction report
   Worker optionally triggers diarization

3. Evidence support
   Clip generation writes clip manifests and captions
   Evidence viewer reads transcript timing plus clip ranges

## Section 7 Deployment workflow and CI CD

1. Build pipeline
   On merge to main: run tests, lint, typecheck
   Build container images for web, api, worker
   Run dependency and container vulnerability scans
   Push images to a private registry

2. Deploy pipeline
   Continuous delivery using GitOps
   Promote staging to production via tagged releases
   Run Prisma migrations as a controlled job during deploy
   Support canary deploy for api and web, with rollback

3. Environment separation
   Separate databases and object storage buckets per environment
   Separate OIDC apps per environment

## Section 8 Observability and reliability targets

1. Core dashboards
   API request rate, latency percentiles, error rate
   Worker throughput, queue lag, job failure rate, retry rate
   Transcription and redaction job durations
   OpenSearch query latency and error rate
   Object storage error rate
   Database connections and slow queries

2. Alerts
   API error rate above threshold
   Queue lag above threshold
   Job failures above threshold
   Disk or memory pressure on nodes
   Search cluster health not green
   Database storage and connection saturation

3. SLOs to adopt early
   Researcher console availability
   Participant session submission success rate
   Time from session complete to transcript ready
   Time from transcript ready to first insights produced

## Section 9 Backups, retention, and disaster recovery

1. Backups
   Postgres: daily full plus point in time recovery
   Object storage: versioning and lifecycle rules, plus periodic replication to a second region if required
   OpenSearch: snapshot repository scheduled snapshots

2. Retention enforcement
   Retention applies to both Postgres records and object storage keys
   Legal hold overrides retention deletion
   Deletion runs produce an audit report of what was deleted

3. Disaster recovery
   Define RPO and RTO per customer tier
   Run a quarterly restore test in staging
   Document a full rebuild runbook that can restore data and reindex search

## Section 10 Minimal viable production setup

If you want the smallest real production that still looks enterprise grade:

1. One Kubernetes cluster with web, api, worker
2. Managed Postgres and managed object storage
3. Managed Redis
4. OpenSearch can be deferred if you provide Postgres full text search initially, then add OpenSearch later
5. CDN plus WAF in front
6. OTEL plus logs plus basic dashboards
7. Backups and retention jobs implemented before onboarding real customers

## Architecture prompt you can hand to a hosting agent

Copy and paste this exactly into your infra agent:

You are the infrastructure and hosting architect for a production SaaS built from a TypeScript monorepo with Next.js web, NestJS api, a BullMQ worker, Postgres, Redis, OpenSearch, and S3 compatible object storage. Design an end to end hosting plan so the application is accessible as a secure website on a custom domain with TLS. Produce a complete architecture and execution plan with the following outputs.

1. Target deployment model
   Choose a primary model using Kubernetes for compute and managed services for Postgres, Redis, OpenSearch, and object storage. Also provide a secondary single tenant Docker based option for enterprise customers.

2. Networking and security
   Define DNS, CDN, WAF, load balancer, ingress routing, private subnets, security group rules, egress controls, and how internal services communicate. Ensure Postgres, Redis, and OpenSearch are never publicly accessible. Include rate limiting and request size limits for media uploads.

3. Identity and access
   Specify OIDC SSO integration, token issuance and verification, RBAC enforcement, service to service auth, and secrets management. Require a secrets manager and least privilege identities.

4. Media pipeline hosting
   Define presigned upload flow to object storage, worker based processing, transcription outputs with word timestamps, redaction outputs, and storage layout for raw and derived artifacts. Include lifecycle policies.

5. CI CD
   Define build, test, container image publishing, vulnerability scanning, environment promotion, GitOps deployment, Prisma migration strategy, canary and rollback.

6. Observability
   Define OpenTelemetry collection, metrics, traces, logs, dashboards, and alert rules focusing on api latency, error rates, queue lag, and job failures.

7. Backups and disaster recovery
   Define Postgres PITR, object storage versioning and replication options, OpenSearch snapshots, RPO and RTO targets, restore testing cadence, and runbooks.

8. Deliverables
   Provide a written architecture spec, a deployment checklist, a Terraform module outline, Kubernetes manifest outline, and a staged rollout plan from staging to production.

Return the plan in a format that can be executed by engineers without additional clarification.

If you want, I can also convert this into a step by step rollout checklist for day 1 staging and day 2 production, aligned to the current AutoQual services and the exact containers you already have.
