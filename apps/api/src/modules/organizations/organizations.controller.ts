import { Body, Controller, Get, Patch } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { OrganizationsService } from "./organizations.service";

@ApiTags("organizations")
@ApiBearerAuth()
@Controller("organizations/current")
export class OrganizationsController {
  constructor(private readonly organizations: OrganizationsService) {}

  @Permissions("settings:manage")
  @Get()
  current(@CurrentUser() user: AuthenticatedUser) {
    return this.organizations.getById(user.organizationId);
  }

  @Permissions("settings:manage")
  @Patch("settings")
  updateSettings(@CurrentUser() user: AuthenticatedUser, @Body() body: Record<string, unknown>) {
    return this.organizations.updateSettings(user.organizationId, body);
  }
}
