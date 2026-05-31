import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { purchaseOrderSchema } from "@ledgent/contracts";
import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { PurchaseOrdersService } from "./purchase-orders.service";

@ApiTags("purchase-orders")
@ApiBearerAuth()
@Controller("purchase-orders")
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrders: PurchaseOrdersService) {}

  @Permissions("purchase_orders:manage")
  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: { page?: number; pageSize?: number; search?: string; status?: string }
  ) {
    return this.purchaseOrders.list(user.organizationId, query);
  }

  @Permissions("purchase_orders:manage")
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body(new ZodValidationPipe(purchaseOrderSchema)) body: unknown) {
    return this.purchaseOrders.create(user.organizationId, user.sub, body as never);
  }

  @Permissions("purchase_orders:manage")
  @Patch(":id")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(purchaseOrderSchema.partial())) body: unknown
  ) {
    return this.purchaseOrders.update(user.organizationId, id, user.sub, body as never);
  }

  @Permissions("purchase_orders:manage")
  @Post(":id/cancel")
  cancel(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.purchaseOrders.cancel(user.organizationId, id, user.sub);
  }
}
