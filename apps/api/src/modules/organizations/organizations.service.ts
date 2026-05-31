import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { OrganizationSettingsInput } from "@ledgent/contracts";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  getById(organizationId: string) {
    return this.prisma.organization.findFirstOrThrow({
      where: { id: organizationId, deletedAt: null },
      select: {
        id: true,
        name: true,
        slug: true,
        baseCurrency: true,
        plan: true,
        settings: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }

  async updateSettings(organizationId: string, userId: string, settings: OrganizationSettingsInput) {
    const current = await this.prisma.organization.findUniqueOrThrow({ where: { id: organizationId } });
    const organization = await this.prisma.organization.update({
      where: { id: organizationId },
      data: { settings: settings as Prisma.InputJsonValue }
    });

    await this.prisma.auditLog.create({
      data: {
        organizationId,
        userId,
        action: "ORGANIZATION_SETTINGS_UPDATED",
        entityType: "Organization",
        entityId: organizationId,
        before: current.settings ?? undefined,
        after: settings as Prisma.InputJsonValue
      }
    });

    return organization;
  }
}
