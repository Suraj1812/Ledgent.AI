import { Body, Controller, Get, Patch } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { organizationSettingsSchema } from "@ledgent/contracts";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
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
  updateSettings(@CurrentUser() user: AuthenticatedUser, @Body(new ZodValidationPipe(organizationSettingsSchema)) body: unknown) {
    return this.organizations.updateSettings(user.organizationId, user.sub, body as never);
  }
}
