import { Controller, Get, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { AuditService } from "./audit.service";

@ApiTags("audit")
@ApiBearerAuth()
@Controller("audit-logs")
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Permissions("audit:read")
  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: { page?: number; pageSize?: number; entityType?: string; action?: string }
  ) {
    return this.audit.list(user.organizationId, query);
  }
}
