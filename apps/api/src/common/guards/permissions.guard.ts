import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { rolePermissions, type Permission } from "@ledgent/contracts";
import { PERMISSIONS_KEY } from "../decorators/permissions.decorator";
import type { AuthenticatedUser } from "../decorators/current-user.decorator";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const required = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (!required?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;

    if (!user) {
      return false;
    }

    const inherited = rolePermissions[user.role] ?? [];
    const granted = new Set([...inherited, ...(user.permissions ?? [])]);
    return required.every((permission) => granted.has(permission));
  }
}
