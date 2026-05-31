import { BadRequestException, Injectable } from "@nestjs/common";
import { hash } from "bcryptjs";
import { randomBytes } from "crypto";
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

  async create(organizationId: string, body: {
    email: string;
    firstName: string;
    lastName: string;
    role: "SUPER_ADMIN" | "FINANCE_ADMIN" | "AP_ACCOUNTANT" | "FINANCE_MANAGER" | "CONTROLLER" | "CFO" | "AUDITOR" | "READ_ONLY";
    permissions?: string[];
    password?: string;
  }) {
    const password = body.password ?? randomBytes(18).toString("base64url");

    if (password.length < 12) {
      throw new BadRequestException("Temporary password must be at least 12 characters");
    }

    return this.prisma.user.create({
      data: {
        organizationId,
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
        role: body.role,
        permissions: body.permissions ?? [],
        passwordHash: await hash(password, 12)
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
  }

  updateStatus(organizationId: string, id: string, isActive: boolean) {
    return this.prisma.user.update({
      where: { id, organizationId },
      data: { isActive },
      select: { id: true, email: true, isActive: true }
    });
  }
}
