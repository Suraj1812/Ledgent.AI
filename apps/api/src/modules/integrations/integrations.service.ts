import { BadRequestException, Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ErpSystem, Prisma } from "@prisma/client";
import type { IntegrationInput } from "@ledgent/contracts";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class IntegrationsService {
  constructor(private readonly prisma: PrismaService) {}

  list(organizationId: string) {
    return this.prisma.erpIntegration.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: { system: "asc" }
    });
  }

  upsert(organizationId: string, userId: string, body: IntegrationInput) {
    return this.prisma.erpIntegration.upsert({
      where: { organizationId_system: { organizationId, system: body.system } },
      update: {
        status: "DISCONNECTED",
        syncSettings: body.syncSettings as Prisma.InputJsonValue,
        updatedById: userId,
        lastError: null
      },
      create: {
        organizationId,
        system: body.system,
        status: "DISCONNECTED",
        syncSettings: body.syncSettings as Prisma.InputJsonValue,
        createdById: userId,
        updatedById: userId
      }
    });
  }

  async postInvoice(organizationId: string, invoiceId: string, system: ErpSystem) {
    const integration = await this.prisma.erpIntegration.findFirst({
      where: { organizationId, system, status: "CONNECTED", deletedAt: null }
    });

    if (!integration?.credentialsRef) {
      throw new BadRequestException(`${system} is not connected. Configure secure ERP credentials before posting invoices.`);
    }

    throw new ServiceUnavailableException(
      `${system} live posting is not configured. Install the provider connector before posting invoice ${invoiceId}.`
    );
  }
}
