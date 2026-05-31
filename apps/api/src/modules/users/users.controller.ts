import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { UsersService } from "./users.service";

@ApiTags("users")
@ApiBearerAuth()
@Controller("users")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Permissions("users:manage")
  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.users.list(user.organizationId);
  }

  @Permissions("users:manage")
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() body: Parameters<UsersService["create"]>[1]) {
    return this.users.create(user.organizationId, body);
  }

  @Permissions("users:manage")
  @Patch(":id/status")
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body("isActive") isActive: boolean
  ) {
    return this.users.updateStatus(user.organizationId, id, isActive);
  }
}
