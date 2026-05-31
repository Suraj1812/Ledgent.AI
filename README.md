# Ledgent.AI

Ledgent.AI is a full-stack accounts payable automation platform. It covers vendor onboarding, purchase orders, invoice intake, PO matching, exception handling, approval routing, audit, reporting, and tenant settings.

## What Is Included

- React 19 + TypeScript + Vite + Material UI finance workspace
- NestJS API with authentication, RBAC, audit, vendor, PO, invoice, approval, AI, ERP, notification, and reporting modules
- Prisma PostgreSQL schema for a multi-tenant AP automation domain
- Shared Zod contracts and role/permission model
- Docker Compose for local PostgreSQL, Redis, API, and frontend
- GitHub Actions CI workflow
- Vercel frontend and Railway API/PostgreSQL deployment configuration

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

## Bootstrap Admin

The seed script creates the bootstrap admin from `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`.
Set a strong password in production before running `npm run seed`.

## Workspace Layout

```text
apps/api        NestJS service, Prisma schema, workers, OpenAPI docs
apps/web        React/MUI finance operations app
packages        Shared contracts, RBAC policy, validation schemas
docs            Architecture, security, testing, deployment notes
```

## Core Workflows

1. Create vendors and manage risk, terms, and supplier balances.
2. Create purchase orders with line items and approval status.
3. Create invoices with vendor, PO, amount, tax, dates, and line-item data.
4. Route invoice approvals by threshold, vendor risk, department, and role.
5. Approve, reject, or request changes from the approval queue.
6. Export live finance data from dashboard, reports, vendors, POs, invoices, and audit views.
7. Preserve audit history for login, workflow, invoice, approval, and vendor actions.

## API Documentation

When the API is running, Swagger is available at:

```text
http://localhost:4000/docs
```

## Production Notes

Use `vercel.json` for the frontend and `railway.json` plus `apps/api/Dockerfile` for the API. The API is stateless, the database is PostgreSQL, and tenant isolation is enforced through `organizationId` filters and RBAC guards.
