import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { approvalDecisionSchema, workflowRuleSchema } from "@ledgent/contracts";
import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { ApprovalsService } from "./approvals.service";

@ApiTags("approvals")
@ApiBearerAuth()
@Controller("approvals")
export class ApprovalsController {
  constructor(private readonly approvals: ApprovalsService) {}

  @Permissions("invoices:approve")
  @Get("queue")
  queue(@CurrentUser() user: AuthenticatedUser) {
    return this.approvals.queue(user.organizationId, user.sub);
  }

  @Permissions("workflows:manage")
  @Get("workflows")
  workflows(@CurrentUser() user: AuthenticatedUser) {
    return this.approvals.workflowDefinitions(user.organizationId);
  }

  @Permissions("workflows:manage")
  @Post("workflows")
  createWorkflow(@CurrentUser() user: AuthenticatedUser, @Body(new ZodValidationPipe(workflowRuleSchema)) body: unknown) {
    return this.approvals.createWorkflowRule(user.organizationId, user.sub, body as never);
  }

  @Permissions("invoices:review")
  @Post("route/:invoiceId")
  routeInvoice(@CurrentUser() user: AuthenticatedUser, @Param("invoiceId") invoiceId: string) {
    return this.approvals.routeInvoice(user.organizationId, invoiceId);
  }

  @Permissions("invoices:approve")
  @Post("tasks/:taskId/decision")
  decide(
    @CurrentUser() user: AuthenticatedUser,
    @Param("taskId") taskId: string,
    @Body(new ZodValidationPipe(approvalDecisionSchema)) body: unknown
  ) {
    return this.approvals.decide(user.organizationId, taskId, user.sub, body as never);
  }
}
