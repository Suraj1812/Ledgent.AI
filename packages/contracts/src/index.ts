import { z } from "zod";

export const roles = [
  "SUPER_ADMIN",
  "FINANCE_ADMIN",
  "AP_ACCOUNTANT",
  "FINANCE_MANAGER",
  "CONTROLLER",
  "CFO",
  "AUDITOR",
  "READ_ONLY"
] as const;

export const permissions = [
  "dashboard:read",
  "vendors:manage",
  "purchase_orders:manage",
  "invoices:upload",
  "invoices:review",
  "invoices:approve",
  "workflows:manage",
  "reports:read",
  "audit:read",
  "users:manage",
  "settings:manage",
  "erp:manage"
] as const;

export type Role = (typeof roles)[number];
export type Permission = (typeof permissions)[number];

export const rolePermissions: Record<Role, Permission[]> = {
  SUPER_ADMIN: [...permissions],
  FINANCE_ADMIN: [
    "dashboard:read",
    "vendors:manage",
    "purchase_orders:manage",
    "invoices:upload",
    "invoices:review",
    "invoices:approve",
    "workflows:manage",
    "reports:read",
    "audit:read",
    "users:manage",
    "settings:manage",
    "erp:manage"
  ],
  AP_ACCOUNTANT: [
    "dashboard:read",
    "vendors:manage",
    "purchase_orders:manage",
    "invoices:upload",
    "invoices:review",
    "reports:read"
  ],
  FINANCE_MANAGER: [
    "dashboard:read",
    "invoices:review",
    "invoices:approve",
    "reports:read",
    "audit:read"
  ],
  CONTROLLER: [
    "dashboard:read",
    "invoices:review",
    "invoices:approve",
    "workflows:manage",
    "reports:read",
    "audit:read",
    "erp:manage"
  ],
  CFO: ["dashboard:read", "invoices:approve", "reports:read", "audit:read"],
  AUDITOR: ["dashboard:read", "reports:read", "audit:read"],
  READ_ONLY: ["dashboard:read", "reports:read"]
};

export const invoiceStatuses = [
  "DRAFT",
  "EXTRACTING",
  "AP_REVIEW",
  "MATCHING",
  "EXCEPTION",
  "PENDING_APPROVAL",
  "APPROVED",
  "REJECTED",
  "POSTED",
  "PAID"
] as const;

export const poStatuses = [
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "PARTIALLY_RECEIVED",
  "RECEIVED",
  "CANCELLED",
  "CLOSED"
] as const;

export const vendorRiskLevels = ["LOW", "MEDIUM", "HIGH", "BLOCKED"] as const;
export const erpSystems = ["SAP", "NETSUITE", "QUICKBOOKS", "ZOHO_BOOKS", "DYNAMICS"] as const;

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(25),
  search: z.string().trim().optional(),
  sortBy: z.string().trim().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc")
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  mfaCode: z.string().trim().min(6).max(8).optional()
});

export const vendorSchema = z.object({
  name: z.string().trim().min(2),
  legalName: z.string().trim().optional(),
  taxId: z.string().trim().optional(),
  email: z.string().email().optional(),
  phone: z.string().trim().optional(),
  paymentTerms: z.string().trim().default("Net 30"),
  currency: z.string().trim().length(3).default("USD"),
  riskLevel: z.enum(vendorRiskLevels).default("LOW")
});

export const purchaseOrderLineItemSchema = z.object({
  sku: z.string().trim().optional(),
  description: z.string().trim().min(1),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().nonnegative(),
  taxRate: z.coerce.number().nonnegative().default(0),
  totalAmount: z.coerce.number().nonnegative()
});

export const purchaseOrderSchema = z.object({
  poNumber: z.string().trim().min(2),
  vendorId: z.string().uuid(),
  department: z.string().trim().min(2),
  currency: z.string().trim().length(3).default("USD"),
  totalAmount: z.coerce.number().nonnegative(),
  approvedAmount: z.coerce.number().nonnegative().optional(),
  status: z.enum(poStatuses).default("DRAFT"),
  expectedDeliveryDate: z.coerce.date().optional(),
  lineItems: z.array(purchaseOrderLineItemSchema).optional()
});

export const invoiceLineItemSchema = z.object({
  description: z.string().trim().min(1),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().nonnegative(),
  taxAmount: z.coerce.number().nonnegative().default(0),
  totalAmount: z.coerce.number().nonnegative()
});

export const invoiceSchema = z.object({
  vendorId: z.string().uuid(),
  purchaseOrderId: z.string().uuid().optional(),
  invoiceNumber: z.string().trim().min(2),
  invoiceDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  currency: z.string().trim().length(3).default("USD"),
  subtotalAmount: z.coerce.number().nonnegative(),
  taxAmount: z.coerce.number().nonnegative().default(0),
  totalAmount: z.coerce.number().positive(),
  paymentTerms: z.string().trim().default("Net 30"),
  lineItems: z.array(invoiceLineItemSchema).min(1)
});

export const approvalDecisionSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT", "REQUEST_CHANGES"]),
  comment: z.string().trim().max(2000).optional()
});

export const workflowRuleSchema = z.object({
  name: z.string().trim().min(3),
  thresholdAmount: z.coerce.number().nonnegative().default(0),
  department: z.string().trim().optional(),
  vendorRiskLevel: z.enum(vendorRiskLevels).optional(),
  approverRole: z.enum(roles),
  escalationHours: z.coerce.number().positive().default(24)
});

export type LoginInput = z.infer<typeof loginSchema>;
export type VendorInput = z.infer<typeof vendorSchema>;
export type PurchaseOrderInput = z.infer<typeof purchaseOrderSchema>;
export type InvoiceInput = z.infer<typeof invoiceSchema>;
export type ApprovalDecisionInput = z.infer<typeof approvalDecisionSchema>;
export type WorkflowRuleInput = z.infer<typeof workflowRuleSchema>;
