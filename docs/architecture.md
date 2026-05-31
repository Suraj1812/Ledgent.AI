# Architecture

Ledgent.AI is organized as a multi-tenant SaaS platform with a React finance workspace, NestJS API, PostgreSQL system of record, Redis-backed background processing, and S3 document storage.

## Runtime Services

- Web app: React 19, Vite, MUI, Redux Toolkit, React Query, React Hook Form, Zod.
- API: NestJS, Prisma, JWT auth, RBAC guards, OpenAPI, rate limiting, structured modules.
- Database: PostgreSQL with tenant-scoped tables, soft deletes, audit logs, AI logs, and ERP posting history.
- Queue: Redis and BullMQ for OCR, AI extraction, matching, notifications, ERP sync, and reminders.
- Object storage: S3 for immutable source documents and generated exports.
- AI layer: extraction, matching, exception detection, finance copilot, and retrieval-ready LangGraph workflow metadata.

## Tenant Isolation

Every tenant-owned table carries `organizationId`, timestamp fields, `createdById`, `updatedById`, and soft delete support where user-facing records can be removed. API services filter all reads and writes by `organizationId` from the authenticated JWT.

## Invoice Flow

1. Document upload creates a `Document` record and S3 storage key.
2. OCR and extraction agents create `AiProcessingLog` records with confidence output.
3. Matching agent compares invoice fields against PO and receipt records.
4. Exception agent writes explanations and suggested next action.
5. Approval engine routes tasks by workflow steps, thresholds, risk, department, and delegation policy.
6. ERP integration posts journals and updates invoice posting state.
7. Audit service captures all state transitions.

## Integration Framework

ERP integrations use a common `ErpIntegration` model with system type, connection status, credential reference, sync settings, and last sync metadata. Connectors for SAP, NetSuite, QuickBooks, Zoho Books, and Dynamics can share the same posting and sync interface.
