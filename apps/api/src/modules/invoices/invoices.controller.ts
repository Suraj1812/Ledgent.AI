import { Body, Controller, Get, Param, Patch, Post, Query, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiConsumes, ApiTags } from "@nestjs/swagger";
import { invoiceSchema } from "@ledgent/contracts";
import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { InvoicesService } from "./invoices.service";

@ApiTags("invoices")
@ApiBearerAuth()
@Controller("invoices")
export class InvoicesController {
  constructor(private readonly invoices: InvoicesService) {}

  @Permissions("invoices:review")
  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: { page?: number; pageSize?: number; search?: string; status?: string }
  ) {
    return this.invoices.list(user.organizationId, query);
  }

  @Permissions("invoices:review")
  @Get(":id")
  get(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.invoices.get(user.organizationId, id);
  }

  @Permissions("invoices:upload")
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body(new ZodValidationPipe(invoiceSchema)) body: unknown) {
    return this.invoices.create(user.organizationId, user.sub, body as never);
  }

  @Permissions("invoices:upload")
  @Post(":id/documents")
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("file"))
  attachDocument(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @UploadedFile() file?: Express.Multer.File
  ) {
    return this.invoices.attachDocument(user.organizationId, user.sub, id, file);
  }

  @Permissions("invoices:review")
  @Patch(":id/status")
  transition(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body("status") status: string,
    @Body("reason") reason?: string
  ) {
    return this.invoices.transition(user.organizationId, id, user.sub, status, reason);
  }

  @Permissions("invoices:review")
  @Post(":id/comments")
  addComment(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body("body") body: string) {
    return this.invoices.addComment(user.organizationId, id, user.sub, body);
  }
}
