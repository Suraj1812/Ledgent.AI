import { BadRequestException, Injectable } from "@nestjs/common";
import type { ApprovalDecisionInput, WorkflowRuleInput } from "@ledgent/contracts";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ApprovalsService {
  constructor(private readonly prisma: PrismaService) {}

  queue(organizationId: string, userId: string) {
    return this.prisma.approvalTask.findMany({
      where: {
        assignedToId: userId,
        status: "PENDING",
        invoice: { organizationId, deletedAt: null }
      },
      include: {
        invoice: {
          include: {
            vendor: true,
            purchaseOrder: true
          }
        },
        workflowStep: true
      },
      orderBy: [{ dueAt: "asc" }, { createdAt: "asc" }]
    });
  }

  workflowDefinitions(organizationId: string) {
    return this.prisma.approvalWorkflow.findMany({
      where: { organizationId, deletedAt: null },
      include: { steps: { orderBy: { sequence: "asc" } } },
      orderBy: { updatedAt: "desc" }
    });
  }

  async createWorkflowRule(organizationId: string, userId: string, input: WorkflowRuleInput) {
    return this.prisma.approvalWorkflow.create({
      data: {
        organizationId,
        name: input.name,
        rules: {
          department: input.department,
          vendorRiskLevel: input.vendorRiskLevel,
          thresholdAmount: input.thresholdAmount
        },
        createdById: userId,
        updatedById: userId,
        steps: {
          create: [
            {
              name: `${input.approverRole.replaceAll("_", " ")} approval`,
              sequence: 1,
              approverRole: input.approverRole,
              thresholdAmount: input.thresholdAmount,
              escalationHours: input.escalationHours
            }
          ]
        }
      },
      include: { steps: true }
    });
  }

  async routeInvoice(organizationId: string, userId: string, invoiceId: string) {
    const invoice = await this.prisma.invoice.findFirstOrThrow({
      where: { id: invoiceId, organizationId, deletedAt: null },
      include: { vendor: true }
    });

    const workflow = await this.prisma.approvalWorkflow.findFirst({
      where: { organizationId, isActive: true, deletedAt: null },
      include: { steps: { orderBy: { sequence: "asc" } } },
      orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }]
    });

    if (!workflow?.steps.length) {
      throw new BadRequestException("No active approval workflow is configured");
    }

    const existingTasks = await this.prisma.approvalTask.count({
      where: { invoiceId: invoice.id, status: "PENDING" }
    });

    if (existingTasks) {
      throw new BadRequestException("This invoice is already routed for approval");
    }

    const eligibleSteps = workflow.steps.filter((step) => Number(invoice.totalAmount) >= Number(step.thresholdAmount));
    const assignments = [];

    for (const step of eligibleSteps) {
      const approver = await this.prisma.user.findFirst({
        where: {
          organizationId,
          role: step.approverRole,
          isActive: true,
          deletedAt: null
        },
        orderBy: { createdAt: "asc" }
      });

      if (!approver) {
        continue;
      }

      assignments.push({ step, approver });
    }

    if (!assignments.length) {
      throw new BadRequestException("No active approver is available for the configured workflow");
    }

    await this.prisma.$transaction([
      ...assignments.map(({ step, approver }) =>
        this.prisma.approvalTask.create({
          data: {
            invoiceId: invoice.id,
            workflowStepId: step.id,
            assignedToId: approver.id,
            dueAt: new Date(Date.now() + step.escalationHours * 60 * 60 * 1000)
          }
        })
      ),
      ...assignments.map(({ step, approver }) =>
        this.prisma.notification.create({
          data: {
            organizationId,
            userId: approver.id,
            channel: "IN_APP",
            title: "Invoice approval assigned",
            body: `${invoice.invoiceNumber} requires ${step.name.toLowerCase()}.`
          }
        })
      ),
      this.prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: "PENDING_APPROVAL" }
      }),
      this.prisma.auditLog.create({
        data: {
          organizationId,
          userId,
          action: "INVOICE_ROUTED_FOR_APPROVAL",
          entityType: "Invoice",
          entityId: invoice.id,
          after: { tasksCreated: assignments.length, workflowId: workflow.id }
        }
      })
    ]);

    return { invoiceId, tasksCreated: assignments.length };
  }

  async decide(organizationId: string, taskId: string, userId: string, input: ApprovalDecisionInput) {
    const task = await this.prisma.approvalTask.findFirstOrThrow({
      where: {
        id: taskId,
        assignedToId: userId,
        invoice: { organizationId, deletedAt: null }
      },
      include: { invoice: true }
    });

    const status =
      input.decision === "APPROVE"
        ? "APPROVED"
        : input.decision === "REJECT"
          ? "REJECTED"
          : "REQUESTED_CHANGES";

    await this.prisma.approvalTask.update({
      where: { id: task.id },
      data: {
        status,
        comment: input.comment,
        completedById: userId,
        completedAt: new Date()
      }
    });

    const openTasks = await this.prisma.approvalTask.count({
      where: { invoiceId: task.invoiceId, status: "PENDING" }
    });

    const nextInvoiceStatus =
      status === "REJECTED" ? "REJECTED" : status === "REQUESTED_CHANGES" ? "AP_REVIEW" : openTasks === 0 ? "APPROVED" : "PENDING_APPROVAL";

    await this.prisma.invoice.update({
      where: { id: task.invoiceId },
      data: { status: nextInvoiceStatus }
    });

    await this.prisma.auditLog.create({
      data: {
        organizationId,
        userId,
        action: `APPROVAL_${status}`,
        entityType: "ApprovalTask",
        entityId: task.id,
        after: { invoiceId: task.invoiceId, comment: input.comment }
      }
    });

    return this.prisma.approvalTask.findUniqueOrThrow({
      where: { id: task.id },
      include: { invoice: true, workflowStep: true }
    });
  }
}
