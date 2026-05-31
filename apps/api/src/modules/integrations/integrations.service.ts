import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

type ErpSystem = "SAP" | "NETSUITE" | "QUICKBOOKS" | "ZOHO_BOOKS" | "DYNAMICS";

@Injectable()
export class IntegrationsService {
  constructor(private readonly prisma: PrismaService) {}

  list(organizationId: string) {
    return this.prisma.erpIntegration.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: { system: "asc" }
    });
  }

  upsert(organizationId: string, userId: string, body: { system: ErpSystem; syncSettings?: Record<string, unknown> }) {
    return this.prisma.erpIntegration.upsert({
      where: { organizationId_system: { organizationId, system: body.system } },
      update: {
        status: "CONNECTED",
        syncSettings: (body.syncSettings ?? {}) as Prisma.InputJsonValue,
        updatedById: userId,
        lastError: null
      },
      create: {
        organizationId,
        system: body.system,
        status: "CONNECTED",
        syncSettings: (body.syncSettings ?? {}) as Prisma.InputJsonValue,
        credentialsRef: `secrets/${organizationId}/${body.system.toLowerCase()}`,
        createdById: userId,
        updatedById: userId
      }
    });
  }

  async postInvoice(organizationId: string, invoiceId: string, system: ErpSystem) {
    const invoice = await this.prisma.invoice.findFirstOrThrow({
      where: { id: invoiceId, organizationId, deletedAt: null }
    });

    const journal = await this.prisma.journalEntry.create({
      data: {
        organizationId,
        invoiceId,
        erpSystem: system,
        debitAccount: "6000-Accounts Payable Expense",
        creditAccount: "2000-Accounts Payable",
        amount: invoice.totalAmount,
        status: "POSTED",
        postedAt: new Date()
      }
    });

    await this.prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: "POSTED",
        erpPostingId: journal.id,
        postedAt: new Date()
      }
    });

    return journal;
  }
}
