import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
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

  updateSettings(organizationId: string, settings: Record<string, unknown>) {
    return this.prisma.organization.update({
      where: { id: organizationId },
      data: { settings: settings as Prisma.InputJsonValue }
    });
  }
}
