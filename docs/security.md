# Security

## Controls Implemented

- JWT access and refresh token flow with session records.
- MFA-ready user model and login enforcement hook.
- Role-based access control with shared role and permission policy.
- Global API rate limiting.
- Helmet security headers.
- Tenant-scoped Prisma filters.
- Immutable audit records for sensitive operations.
- Soft delete support for operational records.
- S3 storage-key design for document isolation.

## Production Requirements

- Store JWT secrets in AWS Secrets Manager.
- Encrypt PostgreSQL, Redis, and S3 data at rest.
- Require HTTPS at the load balancer and set secure cookie flags if cookies are introduced.
- Run malware scanning on uploaded documents before OCR.
- Use presigned S3 URLs with short expiration for document access.
- Add field-level encryption for bank account routing details and tax identifiers.
- Add WAF rules for upload endpoints and authentication endpoints.
- Rotate ERP credentials and never store plaintext secrets in PostgreSQL.

## OWASP Notes

The API validates structured inputs with Zod or DTO validation, rejects unscoped tenant access through guards and service filters, limits request volume, and avoids exposing reset-token presence during forgot-password flows.
