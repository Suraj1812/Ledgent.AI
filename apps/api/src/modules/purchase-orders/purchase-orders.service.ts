import { Injectable } from "@nestjs/common";
import type { PurchaseOrderInput } from "@ledgent/contracts";
import { PrismaService } from "../prisma/prisma.service";

type PurchaseOrderCreateInput = PurchaseOrderInput & {
  lineItems?: Array<{
    sku?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number;
    totalAmount: number;
  }>;
};

@Injectable()
export class PurchaseOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(organizationId: string, query: { page?: number; pageSize?: number; search?: string; status?: string }) {
    const page = Number(query.page ?? 1);
    const pageSize = Number(query.pageSize ?? 25);
    const where = {
      organizationId,
      deletedAt: null,
      ...(query.status ? { status: query.status as never } : {}),
      ...(query.search
        ? {
            OR: [
              { poNumber: { contains: query.search, mode: "insensitive" as const } },
              { department: { contains: query.search, mode: "insensitive" as const } },
              { vendor: { name: { contains: query.search, mode: "insensitive" as const } } }
            ]
          }
        : {})
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.purchaseOrder.findMany({
        where,
        include: {
          vendor: { select: { id: true, name: true, riskLevel: true } },
          lineItems: true,
          _count: { select: { invoices: true, goodsReceipts: true } }
        },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      this.prisma.purchaseOrder.count({ where })
    ]);

    return { items, total, page, pageSize };
  }

  create(organizationId: string, userId: string, input: PurchaseOrderCreateInput) {
    const { lineItems, ...po } = input;

    return this.prisma.purchaseOrder.create({
      data: {
        ...po,
        organizationId,
        approvedAmount: po.approvedAmount ?? po.totalAmount,
        createdById: userId,
        updatedById: userId,
        lineItems: {
          create: lineItems ?? []
        }
      },
      include: { vendor: true, lineItems: true }
    });
  }

  async update(organizationId: string, id: string, userId: string, input: Partial<PurchaseOrderCreateInput>) {
    const { lineItems: _lineItems, ...po } = input;

    await this.prisma.purchaseOrder.updateMany({
      where: { id, organizationId, deletedAt: null },
      data: { ...po, updatedById: userId }
    });

    return this.prisma.purchaseOrder.findFirstOrThrow({
      where: { id, organizationId },
      include: { vendor: true, lineItems: true }
    });
  }

  async cancel(organizationId: string, id: string, userId: string) {
    await this.prisma.purchaseOrder.updateMany({
      where: { id, organizationId, deletedAt: null },
      data: { status: "CANCELLED", updatedById: userId }
    });

    return this.prisma.purchaseOrder.findFirstOrThrow({ where: { id, organizationId } });
  }
}
