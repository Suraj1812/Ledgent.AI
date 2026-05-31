import { Body, Controller, Get, Headers, Ip, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { loginSchema } from "@ledgent/contracts";
import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AuthService } from "./auth.service";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post("login")
  login(
    @Body(new ZodValidationPipe(loginSchema)) body: unknown,
    @Ip() ipAddress: string,
    @Headers("user-agent") userAgent?: string
  ) {
    return this.auth.login(body as never, { ipAddress, userAgent });
  }

  @Public()
  @Post("refresh")
  refresh(@Body("refreshToken") refreshToken: string) {
    return this.auth.refresh(refreshToken);
  }

  @Public()
  @Post("forgot-password")
  forgotPassword(@Body("email") email: string) {
    return this.auth.requestPasswordReset(email);
  }

  @ApiBearerAuth()
  @Get("me")
  me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }

  @ApiBearerAuth()
  @Post("logout")
  async logout(@CurrentUser() user: AuthenticatedUser) {
    await this.auth.logout(user.sub);
    return { ok: true };
  }
}
