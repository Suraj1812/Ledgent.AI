import { Body, Controller, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { AiService } from "./ai.service";

@ApiTags("ai")
@ApiBearerAuth()
@Controller("ai")
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Permissions("invoices:review")
  @Post("invoices/:invoiceId/process")
  processInvoice(@CurrentUser() user: AuthenticatedUser, @Param("invoiceId") invoiceId: string) {
    return this.ai.processInvoice(user.organizationId, invoiceId);
  }

  @Permissions("dashboard:read")
  @Post("copilot")
  askCopilot(@CurrentUser() user: AuthenticatedUser, @Body("question") question: string) {
    return this.ai.askCopilot(user.organizationId, question);
  }
}
