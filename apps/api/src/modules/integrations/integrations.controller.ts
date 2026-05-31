import { Body, Controller, Get, Param, ParseEnumPipe, ParseUUIDPipe, Post } from "@nestjs/common";
import { ErpSystem } from "@prisma/client";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { integrationSchema } from "@ledgent/contracts";
import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
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
  upsert(@CurrentUser() user: AuthenticatedUser, @Body(new ZodValidationPipe(integrationSchema)) body: unknown) {
    return this.integrations.upsert(user.organizationId, user.sub, body as never);
  }

  @Permissions("erp:manage")
  @Post(":system/invoices/:invoiceId/post")
  postInvoice(
    @CurrentUser() user: AuthenticatedUser,
    @Param("system", new ParseEnumPipe(ErpSystem)) system: ErpSystem,
    @Param("invoiceId", new ParseUUIDPipe()) invoiceId: string
  ) {
    return this.integrations.postInvoice(user.organizationId, invoiceId, system);
  }
}
