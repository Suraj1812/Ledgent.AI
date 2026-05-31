import { PrismaClient, Role } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@ledgent.ai";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!adminPassword && process.env.NODE_ENV === "production") {
    throw new Error("SEED_ADMIN_PASSWORD is required in production");
  }

  const bootstrapPassword = adminPassword ?? "LocalDevelopment123!";

  const organization = await prisma.organization.upsert({
    where: { slug: "ledgent-ai-workspace" },
    update: {},
    create: {
      name: "Ledgent AI Workspace",
      slug: "ledgent-ai-workspace",
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
      organizationId: organization.id,
      passwordHash: await hash(bootstrapPassword, 12),
      role: Role.FINANCE_ADMIN,
      permissions: ["dashboard:read", "vendors:manage", "invoices:approve", "reports:read", "audit:read"],
      isActive: true
    },
    create: {
      organizationId: organization.id,
      email: adminEmail,
      passwordHash: await hash(bootstrapPassword, 12),
      firstName: "Ledgent",
      lastName: "Admin",
      role: Role.FINANCE_ADMIN,
      permissions: ["dashboard:read", "vendors:manage", "invoices:approve", "reports:read", "audit:read"]
    }
  });

  const workflow = await prisma.approvalWorkflow.findFirst({
    where: { organizationId: organization.id, name: "Default AP approval", deletedAt: null }
  });

  if (!workflow) {
    await prisma.approvalWorkflow.create({
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
