import { Controller, Get } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ReportsService } from "./reports.service";

@ApiTags("reports")
@ApiBearerAuth()
@Controller("reports")
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Permissions("dashboard:read")
  @Get("dashboard")
  dashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.reports.dashboard(user.organizationId);
  }

  @Permissions("reports:read")
  @Get("spend")
  spend(@CurrentUser() user: AuthenticatedUser) {
    return this.reports.spendAnalysis(user.organizationId);
  }
}
