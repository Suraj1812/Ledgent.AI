import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard(organizationId: string) {
    const [invoices, vendors, approvals] = await this.prisma.$transaction([
      this.prisma.invoice.findMany({
        where: { organizationId, deletedAt: null },
        include: { vendor: true },
        orderBy: { createdAt: "desc" },
        take: 100
      }),
      this.prisma.vendor.count({ where: { organizationId, deletedAt: null } }),
      this.prisma.approvalTask.count({
        where: { status: "PENDING", invoice: { organizationId, deletedAt: null } }
      })
    ]);

    const countFor = (status: string) => invoices.filter((invoice) => invoice.status === status).length;
    const exceptionCount = countFor("EXCEPTION");
    const totalInvoices = invoices.length;
    const invoiceStatus = Object.entries(
      invoices.reduce<Record<string, { count: number; totalAmount: number }>>((accumulator, invoice) => {
        const current = accumulator[invoice.status] ?? { count: 0, totalAmount: 0 };
        accumulator[invoice.status] = {
          count: current.count + 1,
          totalAmount: current.totalAmount + Number(invoice.totalAmount)
        };
        return accumulator;
      }, {})
    ).map(([status, value]) => ({ status, ...value }));

    return {
      kpis: {
        totalInvoices,
        pendingInvoices: countFor("PENDING_APPROVAL"),
        approvedInvoices: countFor("APPROVED"),
        rejectedInvoices: countFor("REJECTED"),
        exceptionRate: totalInvoices ? exceptionCount / totalInvoices : 0,
        monthlySpend: invoices.reduce((sum, invoice) => sum + Number(invoice.totalAmount), 0),
        vendors,
        pendingApprovals: approvals
      },
      invoiceStatus,
      recentInvoices: invoices
    };
  }

  async spendAnalysis(organizationId: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: { organizationId, deletedAt: null },
      include: { vendor: true },
      orderBy: { invoiceDate: "asc" }
    });

    return invoices.map((invoice) => ({
      month: invoice.invoiceDate.toISOString().slice(0, 7),
      vendor: invoice.vendor.name,
      amount: Number(invoice.totalAmount),
      status: invoice.status
    }));
  }
}
