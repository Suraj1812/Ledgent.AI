import { PrismaClient, Role, VendorRiskLevel, PurchaseOrderStatus, InvoiceStatus } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@ledgent.ai";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";

  const organization = await prisma.organization.upsert({
    where: { slug: "acme-industries" },
    update: {},
    create: {
      name: "Acme Industries",
      slug: "acme-industries",
      baseCurrency: "USD",
      settings: {
        matchingTolerancePercent: 2,
        approvalReminderHours: 24,
        autoPostBelowAmount: 500
      }
    }
  });

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: await hash(adminPassword, 12),
      isActive: true
    },
    create: {
      organizationId: organization.id,
      email: adminEmail,
      passwordHash: await hash(adminPassword, 12),
      firstName: "Avery",
      lastName: "Stone",
      role: Role.FINANCE_ADMIN,
      permissions: ["dashboard:read", "vendors:manage", "invoices:approve", "reports:read", "audit:read"]
    }
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@ledgent.ai" },
    update: { isActive: true },
    create: {
      organizationId: organization.id,
      email: "manager@ledgent.ai",
      passwordHash: await hash(adminPassword, 12),
      firstName: "Mina",
      lastName: "Patel",
      role: Role.FINANCE_MANAGER,
      permissions: ["dashboard:read", "invoices:approve", "reports:read", "audit:read"]
    }
  });

  const vendor = await prisma.vendor.upsert({
    where: { organizationId_name: { organizationId: organization.id, name: "Northstar Office Supply" } },
    update: {},
    create: {
      organizationId: organization.id,
      name: "Northstar Office Supply",
      legalName: "Northstar Office Supply LLC",
      taxId: "US-8839201",
      email: "ap@northstar.example",
      phone: "+1-555-0144",
      paymentTerms: "Net 30",
      currency: "USD",
      riskLevel: VendorRiskLevel.LOW,
      createdById: admin.id
    }
  });

  const po = await prisma.purchaseOrder.upsert({
    where: { organizationId_poNumber: { organizationId: organization.id, poNumber: "PO-24018" } },
    update: {},
    create: {
      organizationId: organization.id,
      vendorId: vendor.id,
      poNumber: "PO-24018",
      department: "Operations",
      status: PurchaseOrderStatus.APPROVED,
      currency: "USD",
      totalAmount: "14250.00",
      approvedAmount: "14250.00",
      createdById: admin.id,
      lineItems: {
        create: [
          {
            description: "Facilities consumables",
            quantity: "100.0000",
            unitPrice: "42.5000",
            taxRate: "0.0825",
            totalAmount: "4250.00"
          },
          {
            description: "Quarterly office supply program",
            quantity: "1.0000",
            unitPrice: "10000.0000",
            taxRate: "0.0000",
            totalAmount: "10000.00"
          }
        ]
      }
    }
  });

  const invoice = await prisma.invoice.upsert({
    where: {
      organizationId_vendorId_invoiceNumber: {
        organizationId: organization.id,
        vendorId: vendor.id,
        invoiceNumber: "INV-1005"
      }
    },
    update: {},
    create: {
      organizationId: organization.id,
      vendorId: vendor.id,
      purchaseOrderId: po.id,
      invoiceNumber: "INV-1005",
      status: InvoiceStatus.EXCEPTION,
      invoiceDate: new Date("2026-05-08"),
      dueDate: new Date("2026-06-07"),
      currency: "USD",
      subtotalAmount: "14380.00",
      taxAmount: "350.63",
      totalAmount: "14730.63",
      paymentTerms: "Net 30",
      extractionScore: "0.9420",
      matchScore: "0.7100",
      exceptionSummary: "Invoice total exceeds PO tolerance by 3.4%.",
      createdById: admin.id,
      lineItems: {
        create: [
          {
            description: "Facilities consumables",
            quantity: "100.0000",
            unitPrice: "43.8000",
            taxAmount: "350.63",
            totalAmount: "4380.63",
            confidence: "0.9400"
          },
          {
            description: "Quarterly office supply program",
            quantity: "1.0000",
            unitPrice: "10000.0000",
            taxAmount: "0.00",
            totalAmount: "10000.00",
            confidence: "0.9800"
          }
        ]
      }
    }
  });

  let workflow = await prisma.approvalWorkflow.findFirst({
    where: { organizationId: organization.id, name: "Default AP approval", deletedAt: null },
    include: { steps: true }
  });

  if (!workflow) {
    workflow = await prisma.approvalWorkflow.create({
      data: {
        organizationId: organization.id,
        name: "Default AP approval",
        isDefault: true,
        rules: { thresholdAmount: 0, department: "Finance" },
        createdById: admin.id,
        updatedById: admin.id,
        steps: {
          create: [
            {
              name: "Finance manager approval",
              sequence: 1,
              approverRole: Role.FINANCE_MANAGER,
              thresholdAmount: "0.00",
              escalationHours: 24
            },
            {
              name: "Controller approval",
              sequence: 2,
              approverRole: Role.CONTROLLER,
              thresholdAmount: "50000.00",
              escalationHours: 24
            }
          ]
        }
      },
      include: { steps: true }
    });
  }

  const firstStep = workflow.steps.sort((a, b) => a.sequence - b.sequence)[0];
  if (firstStep) {
    await prisma.approvalTask.upsert({
      where: { id: "seed-approval-inv-1005" },
      update: {},
      create: {
        id: "seed-approval-inv-1005",
        invoiceId: invoice.id,
        workflowStepId: firstStep.id,
        assignedToId: admin.id,
        dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
