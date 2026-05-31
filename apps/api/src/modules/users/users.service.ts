import { Injectable } from "@nestjs/common";
import { hash } from "bcryptjs";
import type { UserInput } from "@ledgent/contracts";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  list(organizationId: string) {
    return this.prisma.user.findMany({
      where: { organizationId, deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        permissions: true,
        isActive: true,
        mfaEnabled: true,
        lastLoginAt: true,
        createdAt: true
      },
      orderBy: { createdAt: "desc" }
    });
  }

  async create(organizationId: string, actorId: string, body: UserInput) {
    const user = await this.prisma.user.create({
      data: {
        organizationId,
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
        role: body.role,
        permissions: body.permissions,
        passwordHash: await hash(body.password, 12)
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        permissions: true,
        isActive: true
      }
    });

    await this.prisma.auditLog.create({
      data: {
        organizationId,
        userId: actorId,
        action: "USER_CREATED",
        entityType: "User",
        entityId: user.id,
        after: { email: user.email, role: user.role, isActive: user.isActive }
      }
    });

    return user;
  }

  async updateStatus(organizationId: string, actorId: string, id: string, isActive: boolean) {
    const user = await this.prisma.user.update({
      where: { id, organizationId },
      data: { isActive },
      select: { id: true, email: true, isActive: true }
    });

    await this.prisma.auditLog.create({
      data: {
        organizationId,
        userId: actorId,
        action: "USER_STATUS_UPDATED",
        entityType: "User",
        entityId: user.id,
        after: { email: user.email, isActive: user.isActive }
      }
    });

    return user;
  }
}
