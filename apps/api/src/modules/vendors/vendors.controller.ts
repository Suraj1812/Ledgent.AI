import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { vendorSchema } from "@ledgent/contracts";
import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { VendorsService } from "./vendors.service";

@ApiTags("vendors")
@ApiBearerAuth()
@Controller("vendors")
export class VendorsController {
  constructor(private readonly vendors: VendorsService) {}

  @Permissions("vendors:manage")
  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: { page?: number; pageSize?: number; search?: string }) {
    return this.vendors.list(user.organizationId, query);
  }

  @Permissions("vendors:manage")
  @Get("analytics")
  analytics(@CurrentUser() user: AuthenticatedUser) {
    return this.vendors.analytics(user.organizationId);
  }

  @Permissions("vendors:manage")
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body(new ZodValidationPipe(vendorSchema)) body: unknown) {
    return this.vendors.create(user.organizationId, user.sub, body as never);
  }

  @Permissions("vendors:manage")
  @Patch(":id")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(vendorSchema.partial())) body: unknown
  ) {
    return this.vendors.update(user.organizationId, id, user.sub, body as never);
  }

  @Permissions("vendors:manage")
  @Delete(":id")
  remove(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.vendors.remove(user.organizationId, id, user.sub);
  }
}
