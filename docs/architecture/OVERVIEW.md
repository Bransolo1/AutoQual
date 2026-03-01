# Architecture Overview

Sensehub Auto Qual is a multi-tenant SaaS with a Next.js web app, NestJS API, and BullMQ workers.

## Services
- Web: Next.js App Router UI
- API: NestJS REST API with RBAC
- Worker: BullMQ workers for async pipeline

## Infrastructure
- PostgreSQL for primary data store
- Redis for queues and cache
- OpenSearch for indexing
- S3-compatible object storage for media
