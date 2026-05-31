import { Injectable } from "@nestjs/common";
import type { VendorInput } from "@ledgent/contracts";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class VendorsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(organizationId: string, query: { page?: number; pageSize?: number; search?: string }) {
    const page = Number(query.page ?? 1);
    const pageSize = Number(query.pageSize ?? 25);
    const where = {
      organizationId,
      deletedAt: null,
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: "insensitive" as const } },
              { legalName: { contains: query.search, mode: "insensitive" as const } },
              { taxId: { contains: query.search, mode: "insensitive" as const } }
            ]
          }
        : {})
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.vendor.findMany({
        where,
        include: {
          _count: { select: { invoices: true, purchaseOrders: true } }
        },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      this.prisma.vendor.count({ where })
    ]);

    return { items, total, page, pageSize };
  }

  create(organizationId: string, userId: string, input: VendorInput) {
    return this.prisma.vendor.create({
      data: {
        organizationId,
        createdById: userId,
        updatedById: userId,
        ...input
      }
    });
  }

  async update(organizationId: string, id: string, userId: string, input: Partial<VendorInput>) {
    await this.prisma.vendor.updateMany({
      where: { id, organizationId, deletedAt: null },
      data: {
        ...input,
        updatedById: userId
      }
    });

    return this.prisma.vendor.findFirstOrThrow({ where: { id, organizationId } });
  }

  async remove(organizationId: string, id: string, userId: string) {
    await this.prisma.vendor.updateMany({
      where: { id, organizationId, deletedAt: null },
      data: { deletedAt: new Date(), updatedById: userId }
    });

    return { ok: true };
  }

  analytics(organizationId: string) {
    return this.prisma.vendor.findMany({
      where: { organizationId, deletedAt: null },
      select: {
        id: true,
        name: true,
        riskLevel: true,
        paymentTerms: true,
        invoices: {
          select: {
            status: true,
            totalAmount: true,
            dueDate: true
          }
        }
      },
      orderBy: { name: "asc" },
      take: 50
    });
  }
}
