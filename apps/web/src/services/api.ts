import type {
  ApprovalDecisionInput,
  InvoiceInput,
  LoginInput,
  PurchaseOrderInput,
  VendorInput,
  WorkflowRuleInput
} from "@ledgent/contracts";
import type { ApprovalTask, AuditEvent, AuthUser, Invoice, PurchaseOrder, Vendor } from "../types/domain";
import { store } from "../store";
import { showToast } from "../store/app-slice";

const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
const ACCESS_TOKEN_KEY = "ledgent.accessToken";
const REFRESH_TOKEN_KEY = "ledgent.refreshToken";
const USER_KEY = "ledgent.user";

type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

type ApiLoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

type ApiTokenResponse = {
  accessToken: string;
  refreshToken: string;
};

export type BrandMeta = {
  title: string;
  description: string;
  logoUrl: string;
  iconUrl: string;
  themeColor: string;
};

export function getAccessToken() {
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getCurrentUser() {
  const raw = window.localStorage.getItem(USER_KEY);
  try {
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    clearSession();
    return null;
  }
}

export function clearSession() {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

function toNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  if (value && typeof value === "object" && "toString" in value) return Number(value.toString());
  return 0;
}

function toIsoDate(value: unknown) {
  return typeof value === "string" ? value.slice(0, 10) : "";
}

let refreshPromise: Promise<boolean> | null = null;

function storeTokens(tokens: ApiTokenResponse) {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

async function refreshSession() {
  const refreshToken = window.localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) return false;

  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken })
    })
      .then(async (response) => {
        if (!response.ok) return false;
        storeTokens((await response.json()) as ApiTokenResponse);
        return true;
      })
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

async function request<T>(path: string, options: RequestInit = {}, allowRefresh = true): Promise<T> {
  const headers = new Headers(options.headers);
  const token = getAccessToken();

  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}/api${path}`, {
    ...options,
    headers
  });

  if (response.status === 401 && allowRefresh && path !== "/auth/login" && path !== "/auth/refresh") {
    const refreshed = await refreshSession();
    if (refreshed) return request<T>(path, options, false);
  }

  if (response.status === 401) {
    clearSession();
    store.dispatch(showToast({ message: "Your session expired. Please sign in again.", severity: "warning" }));
    if (window.location.pathname !== "/login") window.location.assign("/login");
    throw new Error("Your session expired. Please sign in again.");
  }

  if (!response.ok) {
    let message = `API request failed: ${response.status}`;
    try {
      const body = await response.json();
      message = body.message ?? message;
    } catch {
      // Keep the status message when the API did not return JSON.
    }
    throw new Error(Array.isArray(message) ? message.join(", ") : message);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function mapInvoice(record: any): Invoice {
  return {
    id: record.id,
    invoiceNumber: record.invoiceNumber,
    vendorId: record.vendorId,
    vendorName: record.vendor?.name ?? record.vendorName ?? "Unknown vendor",
    purchaseOrderId: record.purchaseOrderId ?? undefined,
    poNumber: record.purchaseOrder?.poNumber ?? record.poNumber ?? undefined,
    status: record.status,
    totalAmount: toNumber(record.totalAmount),
    subtotalAmount: toNumber(record.subtotalAmount),
    taxAmount: toNumber(record.taxAmount),
    currency: record.currency,
    dueDate: toIsoDate(record.dueDate),
    invoiceDate: toIsoDate(record.invoiceDate),
    paymentTerms: record.paymentTerms,
    extractionScore: toNumber(record.extractionScore),
    matchScore: toNumber(record.matchScore),
    exceptionSummary: record.exceptionSummary ?? undefined,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    lineItems: record.lineItems?.map((line: any) => ({
      id: line.id,
      description: line.description,
      quantity: toNumber(line.quantity),
      unitPrice: toNumber(line.unitPrice),
      taxAmount: toNumber(line.taxAmount),
      totalAmount: toNumber(line.totalAmount),
      confidence: line.confidence ? toNumber(line.confidence) : undefined
    })),
    documents: record.documents?.map((document: any) => ({
      id: document.id,
      fileName: document.fileName,
      mimeType: document.mimeType,
      sizeBytes: document.sizeBytes,
      createdAt: document.createdAt
    })),
    approvalTasks: record.approvalTasks?.map((task: any) => ({
      id: task.id,
      status: task.status,
      dueAt: task.dueAt,
      completedAt: task.completedAt,
      approverName: task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : undefined,
      stepName: task.workflowStep?.name
    })),
    aiLogs: record.aiLogs?.map((log: any) => ({
      id: log.id,
      agentName: log.agentName,
      model: log.model,
      confidence: toNumber(log.confidence),
      createdAt: log.createdAt
    })),
    journalEntries: record.journalEntries?.map((entry: any) => ({
      id: entry.id,
      status: entry.status,
      erpSystem: entry.erpSystem,
      postedAt: entry.postedAt,
      createdAt: entry.createdAt
    })),
    comments: record.comments?.map((comment: any) => ({
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt
    }))
  };
}

function groupByMonth(invoices: Invoice[]) {
  const grouped = invoices.reduce<Record<string, { month: string; spend: number; exceptions: number }>>((acc, invoice) => {
    const month = (invoice.invoiceDate || invoice.dueDate || new Date().toISOString()).slice(0, 7);
    const current = acc[month] ?? { month, spend: 0, exceptions: 0 };
    current.spend += invoice.totalAmount;
    current.exceptions += invoice.status === "EXCEPTION" ? 1 : 0;
    acc[month] = current;
    return acc;
  }, {});
  return Object.values(grouped).sort((a, b) => a.month.localeCompare(b.month));
}

function groupVendorSpend(invoices: Invoice[]) {
  const grouped = invoices.reduce<Record<string, number>>((acc, invoice) => {
    acc[invoice.vendorName] = (acc[invoice.vendorName] ?? 0) + invoice.totalAmount;
    return acc;
  }, {});
  return Object.entries(grouped).map(([name, value]) => ({ name, value }));
}

export const api = {
  request,
  meta: () => request<BrandMeta>("/meta", { headers: { "Content-Type": "application/json" } }),
  async login(values: LoginInput) {
    const response = await request<ApiLoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(values)
    });
    storeTokens(response);
    window.localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    return response;
  },
  logout: async () => {
    try {
      await request<{ ok: true }>("/auth/logout", { method: "POST" });
    } finally {
      clearSession();
    }
  },
  me: () => request<AuthUser>("/auth/me"),
  async dashboard() {
    const [dashboard, approvals] = await Promise.all([
      request<any>("/reports/dashboard"),
      request<any[]>("/approvals/queue").catch(() => [])
    ]);
    const invoices: Invoice[] = (dashboard.recentInvoices ?? []).map(mapInvoice);
    const confidenceValues: number[] = invoices.flatMap((invoice) =>
      [invoice.extractionScore, invoice.matchScore].filter((value): value is number => Boolean(value))
    );
    const aiConfidence = confidenceValues.length
      ? confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length
      : 0;

    return {
      kpis: {
        totalInvoices: dashboard.kpis.totalInvoices,
        pendingInvoices: dashboard.kpis.pendingInvoices,
        approvedInvoices: dashboard.kpis.approvedInvoices,
        rejectedInvoices: dashboard.kpis.rejectedInvoices,
        exceptionRate: dashboard.kpis.exceptionRate,
        processingTime: dashboard.kpis.processingTime ?? "Live",
        monthlySpend: dashboard.kpis.monthlySpend,
        aiConfidence
      },
      spendTrend: groupByMonth(invoices),
      vendorSpend: groupVendorSpend(invoices),
      invoices,
      approvals: approvals.map((approval) => ({
        id: approval.id,
        invoiceNumber: approval.invoice?.invoiceNumber,
        vendorName: approval.invoice?.vendor?.name,
        amount: toNumber(approval.invoice?.totalAmount),
        dueAt: approval.dueAt,
        approverRole: approval.workflowStep?.approverRole ?? "FINANCE_MANAGER",
        bottleneckHours: Math.max(0, Math.round((Date.now() - new Date(approval.createdAt).getTime()) / 36e5)),
        status: approval.status
      }))
    };
  },
  async vendors() {
    const records = await request<any[]>("/vendors/analytics");
    return records.map((vendor): Vendor => {
      const invoices = vendor.invoices ?? [];
      const outstanding = invoices
        .filter((invoice: any) => !["PAID", "REJECTED"].includes(invoice.status))
        .reduce((sum: number, invoice: any) => sum + toNumber(invoice.totalAmount), 0);
      const exceptions = invoices.filter((invoice: any) => invoice.status === "EXCEPTION").length;
      const lastInvoiceAt = invoices
        .map((invoice: any) => toIsoDate(invoice.dueDate))
        .filter(Boolean)
        .sort()
        .at(-1);

      return {
        id: vendor.id,
        name: vendor.name,
        riskLevel: vendor.riskLevel,
        paymentTerms: vendor.paymentTerms,
        outstandingBalance: outstanding,
        exceptionRate: invoices.length ? exceptions / invoices.length : 0,
        lastInvoiceAt: lastInvoiceAt ?? "No invoices"
      };
    });
  },
  createVendor: (values: Partial<VendorInput> & { name: string }) =>
    request("/vendors", {
      method: "POST",
      body: JSON.stringify({
        paymentTerms: "Net 30",
        currency: "USD",
        riskLevel: "LOW",
        ...values
      })
    }),
  createPurchaseOrder: (values: PurchaseOrderInput) =>
    request("/purchase-orders", {
      method: "POST",
      body: JSON.stringify(values)
    }),
  async purchaseOrders() {
    const response = await request<Paginated<any>>("/purchase-orders?pageSize=100");
    return response.items.map(
      (record): PurchaseOrder => ({
        id: record.id,
        poNumber: record.poNumber,
        vendorId: record.vendorId,
        vendorName: record.vendor?.name ?? "Unknown vendor",
        department: record.department,
        status: record.status,
        totalAmount: toNumber(record.totalAmount),
        receivedPercent: record.lineItems?.length
          ? Math.round(
              (record.lineItems.reduce((sum: number, line: any) => sum + toNumber(line.receivedQty), 0) /
                record.lineItems.reduce((sum: number, line: any) => sum + toNumber(line.quantity), 0)) *
                100
            )
          : 0
      })
    );
  },
  async invoices() {
    const response = await request<Paginated<any>>("/invoices?pageSize=100");
    return response.items.map(mapInvoice);
  },
  createInvoice: (values: InvoiceInput) =>
    request("/invoices", {
      method: "POST",
      body: JSON.stringify(values)
    }),
  async invoice(id: string) {
    return mapInvoice(await request<any>(`/invoices/${id}`));
  },
  processInvoice: (id: string) =>
    request(`/ai/invoices/${id}/process`, {
      method: "POST"
    }),
  routeInvoice: (id: string) =>
    request(`/approvals/route/${id}`, {
      method: "POST"
    }),
  async approvals() {
    const records = await request<any[]>("/approvals/queue");
    return records.map(
      (record): ApprovalTask => ({
        id: record.id,
        invoiceNumber: record.invoice?.invoiceNumber,
        vendorName: record.invoice?.vendor?.name,
        amount: toNumber(record.invoice?.totalAmount),
        dueAt: record.dueAt,
        approverRole: record.workflowStep?.approverRole ?? "FINANCE_MANAGER",
        bottleneckHours: Math.max(0, Math.round((Date.now() - new Date(record.createdAt).getTime()) / 36e5)),
        status: record.status
      })
    );
  },
  decideApproval: (taskId: string, decision: ApprovalDecisionInput) =>
    request(`/approvals/tasks/${taskId}/decision`, {
      method: "POST",
      body: JSON.stringify(decision)
    }),
  workflows: () => request<any[]>("/approvals/workflows"),
  createWorkflow: (values: WorkflowRuleInput) =>
    request("/approvals/workflows", {
      method: "POST",
      body: JSON.stringify(values)
    }),
  async auditEvents() {
    const response = await request<Paginated<any>>("/audit-logs?pageSize=100");
    return response.items.map(
      (event): AuditEvent => ({
        id: event.id,
        action: event.action,
        actor: event.user ? `${event.user.firstName} ${event.user.lastName}` : "System",
        entityType: event.entityType,
        entityId: event.entityId ?? "",
        createdAt: event.createdAt,
        detail: event.after ? JSON.stringify(event.after) : event.before ? JSON.stringify(event.before) : ""
      })
    );
  },
  async users() {
    return request<any[]>("/users");
  },
  createUser: (values: {
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    permissions?: string[];
    password?: string;
  }) =>
    request("/users", {
      method: "POST",
      body: JSON.stringify(values)
    }),
  updateUserStatus: (id: string, isActive: boolean) =>
    request(`/users/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ isActive })
    }),
  organization: () => request<any>("/organizations/current"),
  updateSettings: (settings: Record<string, unknown>) =>
    request("/organizations/current/settings", {
      method: "PATCH",
      body: JSON.stringify(settings)
    }),
  notifications: () => request<any[]>("/notifications"),
  markNotificationRead: (id: string) =>
    request(`/notifications/${id}/read`, {
      method: "POST"
    }),
  async reports() {
    const [spendTrend, invoices, vendors] = await Promise.all([api.request<any[]>("/reports/spend"), api.invoices(), api.vendors()]);
    return {
      spendTrend: spendTrend.map((row) => ({
        month: row.month,
        spend: toNumber(row.amount),
        exceptions: row.status === "EXCEPTION" ? 1 : 0
      })),
      vendorSpend: groupVendorSpend(invoices),
      invoices,
      vendors
    };
  }
};
