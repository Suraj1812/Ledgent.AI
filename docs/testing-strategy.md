# Testing Strategy

## Unit Tests

- Shared contracts: schema validation, permission matrix, status transitions.
- API services: invoice duplicate detection, matching tolerance, approval decisions, ERP posting.
- Frontend components: dashboard rendering, filters, dialogs, status chips, workflow controls.

## Integration Tests

- Authentication and refresh token lifecycle.
- Tenant isolation for every list and detail endpoint.
- Invoice creation with line items and document metadata.
- AI processing logs and invoice status updates.
- Approval routing and decision outcomes.
- ERP posting and journal creation.

## End-to-End Tests

- Login as finance admin.
- Upload invoice and verify extraction state.
- Resolve exception and route approval.
- Approve invoice as controller.
- Post invoice to ERP sandbox.
- Confirm audit log and report updates.

## Quality Gates

- TypeScript strict mode must pass for every workspace.
- Prisma schema generation must pass in CI.
- API OpenAPI document must be generated at startup.
- UI smoke test should verify dashboard, invoice list, invoice detail, and approval center.
