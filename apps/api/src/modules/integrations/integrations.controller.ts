import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { IntegrationsService } from "./integrations.service";

@ApiTags("integrations")
@ApiBearerAuth()
@Controller("integrations")
export class IntegrationsController {
  constructor(private readonly integrations: IntegrationsService) {}

  @Permissions("erp:manage")
  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.integrations.list(user.organizationId);
  }

  @Permissions("erp:manage")
  @Post()
  upsert(@CurrentUser() user: AuthenticatedUser, @Body() body: Parameters<IntegrationsService["upsert"]>[2]) {
    return this.integrations.upsert(user.organizationId, user.sub, body);
  }

  @Permissions("erp:manage")
  @Post(":system/invoices/:invoiceId/post")
  postInvoice(
    @CurrentUser() user: AuthenticatedUser,
    @Param("system") system: Parameters<IntegrationsService["postInvoice"]>[2],
    @Param("invoiceId") invoiceId: string
  ) {
    return this.integrations.postInvoice(user.organizationId, invoiceId, system);
  }
}
