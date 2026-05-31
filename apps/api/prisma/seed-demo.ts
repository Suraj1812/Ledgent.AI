import {
  ApprovalTaskStatus,
  InvoiceStatus,
  Prisma,
  PrismaClient,
  PurchaseOrderStatus,
  Role,
  VendorRiskLevel
} from "@prisma/client";
import { hash } from "bcryptjs";
import { randomBytes } from "crypto";

type MoneyLine = {
  description: string;
  quantity: number;
  unitPrice: number;
  taxAmount?: number;
  sku?: string;
};

const day = (offset: number) => new Date(Date.now() + offset * 24 * 60 * 60 * 1000);
const month = (offset: number, date = 12) => {
  const value = new Date();
  value.setUTCMonth(value.getUTCMonth() + offset, date);
  value.setUTCHours(12, 0, 0, 0);
  return value;
};
const lineTotal = (line: MoneyLine) => Number((line.quantity * line.unitPrice + (line.taxAmount ?? 0)).toFixed(2));
const amountTotal = (lines: MoneyLine[]) => Number(lines.reduce((sum, line) => sum + lineTotal(line), 0).toFixed(2));

export async function seedDemoWorkspace(prisma: PrismaClient, organizationId: string, adminId: string) {
  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      name: "Northbridge Operations Group",
      taxId: "94-7826410",
      settings: {
        matchingTolerancePercent: 2,
        quantityTolerancePercent: 1,
        currencyPolicy: "review",
        duplicateDetectionEnabled: true,
        requirePoAboveThreshold: true,
        mfaRequiredForFinanceAdmins: true,
        notifyApproversBeforeSlaBreach: true,
        archiveOriginalDocuments: false,
        sessionTimeoutMinutes: 30,
        defaultErp: "NETSUITE",
        sampleWorkspace: true
      }
    }
  });

  const sharedAdmin =
    (await prisma.user.findUnique({ where: { email: "shared.admin@ledgent.ai" } })) ??
    (await prisma.user.findUniqueOrThrow({ where: { id: adminId } }));

  const internalUsers = [
    ["maya.chen@northbridge.example", "Maya", "Chen", Role.FINANCE_MANAGER],
    ["daniel.reyes@northbridge.example", "Daniel", "Reyes", Role.CONTROLLER],
    ["priya.shah@northbridge.example", "Priya", "Shah", Role.AP_ACCOUNTANT],
    ["elena.morris@northbridge.example", "Elena", "Morris", Role.CFO]
  ] as const;

  for (const [email, firstName, lastName, role] of internalUsers) {
    await prisma.user.upsert({
      where: { email },
      update: { organizationId, firstName, lastName, role, isActive: true },
      create: {
        organizationId,
        email,
        firstName,
        lastName,
        role,
        permissions: [],
        passwordHash: await hash(randomBytes(24).toString("base64url"), 12)
      }
    });
  }

  const vendorDefinitions = [
    ["Meridian Cloud Infrastructure", "Meridian Cloud Infrastructure LLC", "billing@meridiancloud.example", "Net 30", VendorRiskLevel.LOW],
    ["Harborline Office Supply", "Harborline Office Supply Inc.", "ar@harborline.example", "Net 45", VendorRiskLevel.LOW],
    ["Apex Facilities Group", "Apex Facilities Group LLC", "invoices@apexfacilities.example", "Net 30", VendorRiskLevel.MEDIUM],
    ["Summit Logistics Services", "Summit Logistics Services Inc.", "billing@summitlogistics.example", "Net 30", VendorRiskLevel.LOW],
    ["Brightwell Talent Partners", "Brightwell Talent Partners LLC", "finance@brightwell.example", "Net 15", VendorRiskLevel.MEDIUM],
    ["Clearview Security Systems", "Clearview Security Systems Inc.", "receivables@clearviewsecurity.example", "Net 30", VendorRiskLevel.HIGH],
    ["Evergreen Marketing Studio", "Evergreen Marketing Studio LLC", "accounts@evergreenstudio.example", "Net 30", VendorRiskLevel.LOW],
    ["Vertex Data Networks", "Vertex Data Networks Corp.", "billing@vertexnetworks.example", "Net 45", VendorRiskLevel.LOW]
  ] as const;

  const vendors = new Map<string, Awaited<ReturnType<typeof prisma.vendor.upsert>>>();
  for (const [name, legalName, email, paymentTerms, riskLevel] of vendorDefinitions) {
    const vendor = await prisma.vendor.upsert({
      where: { organizationId_name: { organizationId, name } },
      update: { legalName, email, paymentTerms, riskLevel, onboardingState: "active", updatedById: adminId },
      create: {
        organizationId,
        name,
        legalName,
        email,
        paymentTerms,
        riskLevel,
        currency: "USD",
        onboardingState: "active",
        createdById: adminId,
        updatedById: adminId
      }
    });
    vendors.set(name, vendor);

    if ((await prisma.vendorContact.count({ where: { vendorId: vendor.id } })) === 0) {
      await prisma.vendorContact.create({
        data: {
          vendorId: vendor.id,
          name: email.split("@")[0].replaceAll(".", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
          email,
          title: "Accounts Receivable",
          isPrimary: true
        }
      });
    }

    if ((await prisma.vendorBankAccount.count({ where: { vendorId: vendor.id } })) === 0) {
      await prisma.vendorBankAccount.create({
        data: {
          vendorId: vendor.id,
          bankName: "Commercial Treasury Bank",
          accountLast4: String(1000 + vendorDefinitions.findIndex((definition) => definition[0] === name) * 137).slice(-4),
          country: "US",
          isVerified: riskLevel !== VendorRiskLevel.HIGH
        }
      });
    }
  }

  const poDefinitions: Array<{
    poNumber: string;
    vendor: string;
    department: string;
    status: PurchaseOrderStatus;
    lines: MoneyLine[];
    receivedPercent: number;
  }> = [
    { poNumber: "PO-2026-1048", vendor: "Meridian Cloud Infrastructure", department: "Engineering", status: "APPROVED", lines: [{ sku: "CLOUD-ENT", description: "Enterprise cloud platform subscription", quantity: 12, unitPrice: 8400 }], receivedPercent: 100 },
    { poNumber: "PO-2026-1061", vendor: "Harborline Office Supply", department: "Operations", status: "PARTIALLY_RECEIVED", lines: [{ sku: "ERG-CHAIR", description: "Ergonomic task chairs", quantity: 90, unitPrice: 412 }, { sku: "DESK-RISE", description: "Adjustable workstation desks", quantity: 45, unitPrice: 695 }], receivedPercent: 78 },
    { poNumber: "PO-2026-1074", vendor: "Apex Facilities Group", department: "Facilities", status: "RECEIVED", lines: [{ sku: "HVAC-Q2", description: "Quarterly HVAC preventive maintenance", quantity: 1, unitPrice: 28400 }], receivedPercent: 100 },
    { poNumber: "PO-2026-1082", vendor: "Summit Logistics Services", department: "Supply Chain", status: "APPROVED", lines: [{ sku: "FREIGHT-MAY", description: "Regional freight and handling services", quantity: 1, unitPrice: 46850 }], receivedPercent: 0 },
    { poNumber: "PO-2026-1093", vendor: "Brightwell Talent Partners", department: "People", status: "APPROVED", lines: [{ sku: "RECRUIT-FIN", description: "Finance recruitment placement services", quantity: 2, unitPrice: 18250 }], receivedPercent: 100 },
    { poNumber: "PO-2026-1107", vendor: "Clearview Security Systems", department: "Security", status: "PENDING_APPROVAL", lines: [{ sku: "ACCESS-CTRL", description: "Badge access control expansion", quantity: 1, unitPrice: 78200 }], receivedPercent: 0 },
    { poNumber: "PO-2026-1115", vendor: "Evergreen Marketing Studio", department: "Marketing", status: "APPROVED", lines: [{ sku: "CAMPAIGN-Q2", description: "Q2 brand campaign production", quantity: 1, unitPrice: 24750 }], receivedPercent: 100 },
    { poNumber: "PO-2026-1124", vendor: "Vertex Data Networks", department: "IT", status: "PARTIALLY_RECEIVED", lines: [{ sku: "EDGE-SW48", description: "48-port managed edge switches", quantity: 18, unitPrice: 2180 }, { sku: "SUPPORT-3Y", description: "Three-year network support coverage", quantity: 1, unitPrice: 12600 }], receivedPercent: 62 }
  ];

  const purchaseOrders = new Map<string, Awaited<ReturnType<typeof prisma.purchaseOrder.upsert>>>();
  for (const po of poDefinitions) {
    const vendor = vendors.get(po.vendor)!;
    const totalAmount = amountTotal(po.lines);
    const purchaseOrder = await prisma.purchaseOrder.upsert({
      where: { organizationId_poNumber: { organizationId, poNumber: po.poNumber } },
      update: {
        vendorId: vendor.id,
        department: po.department,
        status: po.status,
        totalAmount,
        approvedAmount: totalAmount,
        expectedDeliveryDate: day(21),
        updatedById: adminId
      },
      create: {
        organizationId,
        vendorId: vendor.id,
        poNumber: po.poNumber,
        department: po.department,
        status: po.status,
        currency: "USD",
        totalAmount,
        approvedAmount: totalAmount,
        expectedDeliveryDate: day(21),
        createdById: adminId,
        updatedById: adminId,
        lineItems: {
          create: po.lines.map((line) => ({
            sku: line.sku,
            description: line.description,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            totalAmount: lineTotal(line),
            receivedQty: Number(((line.quantity * po.receivedPercent) / 100).toFixed(4))
          }))
        }
      }
    });
    purchaseOrders.set(po.poNumber, purchaseOrder);

    if (po.receivedPercent > 0) {
      const receiptNumber = `GRN-${po.poNumber.slice(-4)}`;
      const receipt = await prisma.goodsReceipt.findFirst({ where: { purchaseOrderId: purchaseOrder.id, receiptNumber } });
      if (!receipt) {
        await prisma.goodsReceipt.create({
          data: {
            purchaseOrderId: purchaseOrder.id,
            receiptNumber,
            receivedAt: day(-12),
            createdById: adminId,
            lineItems: {
              create: po.lines.map((line) => ({
                description: line.description,
                quantity: Number(((line.quantity * po.receivedPercent) / 100).toFixed(4))
              }))
            }
          }
        });
      }
    }
  }

  const invoiceDefinitions: Array<{
    invoiceNumber: string;
    vendor: string;
    poNumber?: string;
    status: InvoiceStatus;
    invoiceDate: Date;
    dueDate: Date;
    lines: MoneyLine[];
    extractionScore: number;
    matchScore: number;
    exceptionSummary?: string;
    paidAt?: Date;
    postedAt?: Date;
  }> = [
    { invoiceNumber: "MC-2605-1842", vendor: "Meridian Cloud Infrastructure", poNumber: "PO-2026-1048", status: "PAID", invoiceDate: month(-5), dueDate: month(-4, 11), lines: [{ description: "Enterprise cloud platform subscription - December", quantity: 1, unitPrice: 8400 }], extractionScore: 0.99, matchScore: 0.98, paidAt: month(-4, 5), postedAt: month(-4, 2) },
    { invoiceNumber: "HL-74192", vendor: "Harborline Office Supply", poNumber: "PO-2026-1061", status: "POSTED", invoiceDate: month(-4), dueDate: month(-3, 11), lines: [{ description: "Ergonomic task chairs - first shipment", quantity: 40, unitPrice: 412 }, { description: "Adjustable workstation desks - first shipment", quantity: 18, unitPrice: 695 }], extractionScore: 0.97, matchScore: 0.95, postedAt: month(-3, 4) },
    { invoiceNumber: "AFG-8840", vendor: "Apex Facilities Group", poNumber: "PO-2026-1074", status: "PAID", invoiceDate: month(-3), dueDate: month(-2, 11), lines: [{ description: "Quarterly HVAC preventive maintenance", quantity: 1, unitPrice: 28400 }], extractionScore: 0.98, matchScore: 0.97, paidAt: month(-2, 8), postedAt: month(-2, 2) },
    { invoiceNumber: "SL-2026-0317", vendor: "Summit Logistics Services", poNumber: "PO-2026-1082", status: "APPROVED", invoiceDate: month(-2), dueDate: month(-1, 11), lines: [{ description: "Regional freight and handling services", quantity: 1, unitPrice: 46850 }], extractionScore: 0.96, matchScore: 0.96 },
    { invoiceNumber: "BTP-5126", vendor: "Brightwell Talent Partners", poNumber: "PO-2026-1093", status: "APPROVED", invoiceDate: month(-1), dueDate: month(0, 11), lines: [{ description: "Finance recruitment placement - senior analyst", quantity: 1, unitPrice: 18250 }], extractionScore: 0.94, matchScore: 0.96 },
    { invoiceNumber: "CVI-20441", vendor: "Clearview Security Systems", poNumber: "PO-2026-1107", status: "EXCEPTION", invoiceDate: day(-15), dueDate: day(15), lines: [{ description: "Badge access control expansion - phase one", quantity: 1, unitPrice: 84600 }], extractionScore: 0.92, matchScore: 0.71, exceptionSummary: "Invoice total exceeds PO tolerance by $6,400. Vendor risk level is HIGH. Controller review required before payment." },
    { invoiceNumber: "EMS-6198", vendor: "Evergreen Marketing Studio", poNumber: "PO-2026-1115", status: "PENDING_APPROVAL", invoiceDate: day(-12), dueDate: day(18), lines: [{ description: "Q2 brand campaign production milestone", quantity: 1, unitPrice: 24750 }], extractionScore: 0.97, matchScore: 0.96 },
    { invoiceNumber: "VDN-90817", vendor: "Vertex Data Networks", poNumber: "PO-2026-1124", status: "PENDING_APPROVAL", invoiceDate: day(-10), dueDate: day(35), lines: [{ description: "Managed edge switches - delivered quantity", quantity: 11, unitPrice: 2180 }, { description: "Network support coverage", quantity: 1, unitPrice: 12600 }], extractionScore: 0.95, matchScore: 0.93 },
    { invoiceNumber: "AFG-8917", vendor: "Apex Facilities Group", status: "EXCEPTION", invoiceDate: day(-8), dueDate: day(22), lines: [{ description: "Emergency chiller inspection and repair", quantity: 1, unitPrice: 12780 }], extractionScore: 0.91, matchScore: 0.15, exceptionSummary: "No purchase order is linked to this invoice. AP review and facilities owner confirmation required." },
    { invoiceNumber: "HL-74811", vendor: "Harborline Office Supply", poNumber: "PO-2026-1061", status: "AP_REVIEW", invoiceDate: day(-6), dueDate: day(39), lines: [{ description: "Ergonomic task chairs - remaining shipment", quantity: 50, unitPrice: 412 }, { description: "Adjustable workstation desks - remaining shipment", quantity: 27, unitPrice: 695 }], extractionScore: 0.94, matchScore: 0.95 },
    { invoiceNumber: "MC-2605-2194", vendor: "Meridian Cloud Infrastructure", poNumber: "PO-2026-1048", status: "PENDING_APPROVAL", invoiceDate: day(-4), dueDate: day(26), lines: [{ description: "Enterprise cloud platform subscription - May", quantity: 1, unitPrice: 8400 }], extractionScore: 0.99, matchScore: 0.98 },
    { invoiceNumber: "SL-2026-0528", vendor: "Summit Logistics Services", poNumber: "PO-2026-1082", status: "REJECTED", invoiceDate: day(-3), dueDate: day(27), lines: [{ description: "Expedited freight surcharge", quantity: 1, unitPrice: 9650 }], extractionScore: 0.93, matchScore: 0.71, exceptionSummary: "Freight surcharge was not authorized on the purchase order. Vendor clarification requested." },
    { invoiceNumber: "BTP-5204", vendor: "Brightwell Talent Partners", poNumber: "PO-2026-1093", status: "AP_REVIEW", invoiceDate: day(-2), dueDate: day(13), lines: [{ description: "Finance recruitment placement - AP specialist", quantity: 1, unitPrice: 18250 }], extractionScore: 0.96, matchScore: 0.96 },
    { invoiceNumber: "VDN-91002", vendor: "Vertex Data Networks", poNumber: "PO-2026-1124", status: "DRAFT", invoiceDate: day(-1), dueDate: day(44), lines: [{ description: "Network implementation services", quantity: 24, unitPrice: 325 }], extractionScore: 0.88, matchScore: 0.89 }
  ];

  const invoices = new Map<string, Awaited<ReturnType<typeof prisma.invoice.upsert>>>();
  for (const invoice of invoiceDefinitions) {
    const vendor = vendors.get(invoice.vendor)!;
    const purchaseOrderId = invoice.poNumber ? purchaseOrders.get(invoice.poNumber)!.id : undefined;
    const subtotalAmount = amountTotal(invoice.lines);
    const taxAmount = Number((subtotalAmount * 0.0825).toFixed(2));
    const totalAmount = Number((subtotalAmount + taxAmount).toFixed(2));
    const record = await prisma.invoice.upsert({
      where: { organizationId_vendorId_invoiceNumber: { organizationId, vendorId: vendor.id, invoiceNumber: invoice.invoiceNumber } },
      update: {
        purchaseOrderId,
        status: invoice.status,
        invoiceDate: invoice.invoiceDate,
        dueDate: invoice.dueDate,
        subtotalAmount,
        taxAmount,
        totalAmount,
        extractionScore: invoice.extractionScore,
        matchScore: invoice.matchScore,
        exceptionSummary: invoice.exceptionSummary,
        paidAt: invoice.paidAt,
        postedAt: invoice.postedAt,
        updatedById: adminId
      },
      create: {
        organizationId,
        vendorId: vendor.id,
        purchaseOrderId,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        invoiceDate: invoice.invoiceDate,
        dueDate: invoice.dueDate,
        currency: "USD",
        subtotalAmount,
        taxAmount,
        totalAmount,
        paymentTerms: vendor.paymentTerms,
        extractionScore: invoice.extractionScore,
        matchScore: invoice.matchScore,
        exceptionSummary: invoice.exceptionSummary,
        paidAt: invoice.paidAt,
        postedAt: invoice.postedAt,
        createdById: adminId,
        updatedById: adminId,
        lineItems: {
          create: invoice.lines.map((line) => ({
            description: line.description,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            taxAmount: line.taxAmount ?? 0,
            totalAmount: lineTotal(line),
            confidence: invoice.extractionScore
          }))
        }
      }
    });
    invoices.set(invoice.invoiceNumber, record);

    if ((await prisma.aiProcessingLog.count({ where: { invoiceId: record.id } })) === 0) {
      await prisma.aiProcessingLog.createMany({
        data: [
          { organizationId, invoiceId: record.id, agentName: "invoice-extraction-agent", model: "validated-input-v1", confidence: invoice.extractionScore, result: { source: "validated-input", fieldsValidated: invoice.lines.length + 6 } },
          { organizationId, invoiceId: record.id, agentName: "invoice-matching-agent", model: "deterministic-policy-v1", confidence: invoice.matchScore, result: { purchaseOrder: invoice.poNumber ?? null, matchScore: invoice.matchScore } },
          { organizationId, invoiceId: record.id, agentName: "exception-detection-agent", model: "deterministic-policy-v1", confidence: invoice.exceptionSummary ? 0.88 : 0.99, result: { exceptionSummary: invoice.exceptionSummary ?? null } }
        ]
      });
    }
  }

  const workflow = await prisma.approvalWorkflow.findFirstOrThrow({
    where: { organizationId, name: "Default AP approval", deletedAt: null },
    include: { steps: { orderBy: { sequence: "asc" } } }
  });
  const workflowStepId = workflow.steps[0]?.id;

  for (const [invoiceNumber, status, ageHours] of [
    ["EMS-6198", ApprovalTaskStatus.PENDING, 19],
    ["VDN-90817", ApprovalTaskStatus.PENDING, 31],
    ["MC-2605-2194", ApprovalTaskStatus.PENDING, 7],
    ["SL-2026-0317", ApprovalTaskStatus.APPROVED, 0],
    ["SL-2026-0528", ApprovalTaskStatus.REJECTED, 0]
  ] as const) {
    const invoice = invoices.get(invoiceNumber)!;
    const existing = await prisma.approvalTask.findFirst({ where: { invoiceId: invoice.id, assignedToId: sharedAdmin.id, status } });
    if (!existing) {
      await prisma.approvalTask.create({
        data: {
          invoiceId: invoice.id,
          workflowStepId,
          assignedToId: sharedAdmin.id,
          completedById: status === ApprovalTaskStatus.PENDING ? undefined : sharedAdmin.id,
          status,
          dueAt: day(status === ApprovalTaskStatus.PENDING ? 1 : -4),
          completedAt: status === ApprovalTaskStatus.PENDING ? undefined : day(-4),
          comment: status === ApprovalTaskStatus.APPROVED ? "Budget owner confirmed delivery and coding." : status === ApprovalTaskStatus.REJECTED ? "Surcharge was not included in the contracted lane pricing." : undefined,
          createdAt: new Date(Date.now() - ageHours * 60 * 60 * 1000)
        }
      });
    }
  }

  for (const [invoiceNumber, body] of [
    ["CVI-20441", "Controller review required: PO variance and high-risk supplier controls are both active."],
    ["AFG-8917", "Facilities confirmed this was an emergency callout. Waiting for the cost-center owner to provide the PO waiver."],
    ["VDN-90817", "Receiving team confirmed eleven switches are installed. Remaining equipment is expected next week."]
  ] as const) {
    const invoice = invoices.get(invoiceNumber)!;
    if ((await prisma.comment.count({ where: { invoiceId: invoice.id, body } })) === 0) {
      await prisma.comment.create({ data: { invoiceId: invoice.id, authorId: adminId, body } });
    }
  }

  for (const [title, body] of [
    ["Approval nearing SLA", "VDN-90817 has been waiting for approval for 31 hours."],
    ["Invoice exception assigned", "CVI-20441 requires controller review for a PO variance and supplier risk hold."],
    ["New invoice ready for review", "HL-74811 completed intake validation and is ready for AP review."]
  ] as const) {
    if ((await prisma.notification.count({ where: { organizationId, userId: sharedAdmin.id, title, body } })) === 0) {
      await prisma.notification.create({ data: { organizationId, userId: sharedAdmin.id, channel: "IN_APP", title, body } });
    }
  }

  await prisma.erpIntegration.upsert({
    where: { organizationId_system: { organizationId, system: "NETSUITE" } },
    update: { status: "DISCONNECTED", syncSettings: { subsidiary: "Northbridge US", autoPostApprovedInvoices: false }, updatedById: adminId },
    create: {
      organizationId,
      system: "NETSUITE",
      status: "DISCONNECTED",
      syncSettings: { subsidiary: "Northbridge US", autoPostApprovedInvoices: false },
      createdById: adminId,
      updatedById: adminId
    }
  });

  for (const [action, entityType, entityId, after] of [
    ["SAMPLE_PORTFOLIO_LOADED", "Organization", organizationId, { vendors: vendors.size, purchaseOrders: purchaseOrders.size, invoices: invoices.size }],
    ["INVOICE_EXCEPTION_DETECTED", "Invoice", invoices.get("CVI-20441")!.id, { invoiceNumber: "CVI-20441", reason: "PO variance and vendor risk" }],
    ["INVOICE_ROUTED_FOR_APPROVAL", "Invoice", invoices.get("VDN-90817")!.id, { invoiceNumber: "VDN-90817", approver: "Shared Admin" }],
    ["APPROVAL_APPROVED", "ApprovalTask", invoices.get("SL-2026-0317")!.id, { invoiceNumber: "SL-2026-0317", comment: "Delivery and coding confirmed" }],
    ["APPROVAL_REJECTED", "ApprovalTask", invoices.get("SL-2026-0528")!.id, { invoiceNumber: "SL-2026-0528", comment: "Unauthorized surcharge" }]
  ] as const) {
    if ((await prisma.auditLog.count({ where: { organizationId, action, entityType, entityId } })) === 0) {
      await prisma.auditLog.create({
        data: { organizationId, userId: adminId, action, entityType, entityId, after: after as Prisma.InputJsonValue }
      });
    }
  }
}
