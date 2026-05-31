import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { Role } from "@ledgent/contracts";

export type AuthenticatedUser = {
  sub: string;
  email: string;
  organizationId: string;
  role: Role;
  permissions: string[];
};

export const CurrentUser = createParamDecorator((_: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<{ user: AuthenticatedUser }>();
  return request.user;
});
