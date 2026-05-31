# Ledgent.AI

Ledgent.AI is a full-stack, AI-first accounts payable automation platform. It covers invoice ingestion, extraction, PO/GRN matching, exception detection, approval routing, ERP posting, audit, reporting, and finance copilot workflows.

## What Is Included

- React 19 + TypeScript + Vite + Material UI finance workspace
- NestJS API with authentication, RBAC, audit, vendor, PO, invoice, approval, AI, ERP, notification, and reporting modules
- Prisma PostgreSQL schema for a multi-tenant AP automation domain
- Shared Zod contracts and role/permission model
- Docker Compose for PostgreSQL, Redis, API, and frontend
- GitHub Actions CI workflow
- AWS ECS deployment plan and production hardening notes

## Quick Start

```bash
npm install
cp .env.example .env
docker compose up -d postgres redis
npm run prisma:generate
npm run prisma:migrate
npm run seed
npm run dev
```

The frontend runs on `http://localhost:5173` and the API runs on `http://localhost:4000`.

## Demo Credentials

```text
Email: admin@ledgent.ai
Password: ChangeMe123!
```

## Workspace Layout

```text
apps/api        NestJS service, Prisma schema, workers, OpenAPI docs
apps/web        React/MUI finance operations app
packages        Shared contracts, RBAC policy, validation schemas
docs            Architecture, security, testing, deployment notes
```

## Core Workflows

1. Upload invoices through drag-and-drop or email ingestion.
2. Run OCR and AI extraction with field-level confidence.
3. Match invoices against POs and goods receipts.
4. Detect exceptions and generate suggested resolutions.
5. Route approvals by threshold, vendor risk, department, and delegation rules.
6. Post approved invoices or journals into ERP connectors.
7. Preserve immutable audit history for every action.

## API Documentation

When the API is running, Swagger is available at:

```text
http://localhost:4000/docs
```

## Production Notes

Use the included Dockerfiles and `docs/production-deployment-plan.md` as the baseline for AWS ECS. The API is stateless, documents belong in S3, background jobs run through BullMQ and Redis, and tenant isolation is enforced through `organizationId` filters and RBAC guards.
