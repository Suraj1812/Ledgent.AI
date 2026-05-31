import type { Role } from "@ledgent/contracts";

export type InvoiceStatus =
  | "DRAFT"
  | "EXTRACTING"
  | "AP_REVIEW"
  | "MATCHING"
  | "EXCEPTION"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "POSTED"
  | "PAID";

export type Vendor = {
  id: string;
  name: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "BLOCKED";
  paymentTerms: string;
  outstandingBalance: number;
  exceptionRate: number;
  lastInvoiceAt: string;
};

export type PurchaseOrder = {
  id: string;
  poNumber: string;
  vendorName: string;
  department: string;
  status: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "PARTIALLY_RECEIVED" | "RECEIVED" | "CANCELLED" | "CLOSED";
  totalAmount: number;
  receivedPercent: number;
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  vendorName: string;
  vendorId?: string;
  poNumber?: string;
  purchaseOrderId?: string;
  status: InvoiceStatus;
  totalAmount: number;
  subtotalAmount?: number;
  taxAmount?: number;
  currency: string;
  dueDate: string;
  invoiceDate?: string;
  paymentTerms?: string;
  extractionScore: number;
  matchScore: number;
  exceptionSummary?: string;
  lineItems?: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxAmount: number;
    totalAmount: number;
    confidence?: number;
  }>;
};

export type ApprovalTask = {
  id: string;
  invoiceNumber: string;
  vendorName: string;
  amount: number;
  dueAt: string;
  approverRole: Role;
  bottleneckHours: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "REQUESTED_CHANGES";
};

export type AuditEvent = {
  id: string;
  action: string;
  actor: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  detail: string;
};

export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  permissions: string[];
  organization: {
    id: string;
    name: string;
    slug: string;
  };
};
