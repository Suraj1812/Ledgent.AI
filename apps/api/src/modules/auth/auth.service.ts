import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { compare } from "bcryptjs";
import { createHash, randomBytes, timingSafeEqual } from "crypto";
import type { LoginInput } from "@ledgent/contracts";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService
  ) {}

  async login(input: LoginInput, meta: { ipAddress?: string; userAgent?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
      include: { organization: true }
    });

    if (!user || !user.isActive || user.deletedAt) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const passwordMatches = await compare(input.password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException("Invalid email or password");
    }

    if (user.mfaEnabled && !input.mfaCode) {
      throw new UnauthorizedException("MFA code is required");
    }

    const tokens = await this.issueTokens({
      sub: user.id,
      email: user.email,
      organizationId: user.organizationId,
      role: user.role,
      permissions: user.permissions
    });

    await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshHash: digestRefreshToken(tokens.refreshToken),
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    await this.prisma.auditLog.create({
      data: {
        organizationId: user.organizationId,
        userId: user.id,
        action: "LOGIN",
        entityType: "Session",
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent
      }
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        permissions: user.permissions,
        organization: {
          id: user.organization.id,
          name: user.organization.name,
          slug: user.organization.slug
        }
      },
      ...tokens
    };
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string };

    try {
      payload = await this.jwt.verifyAsync<{ sub: string }>(refreshToken, {
        secret: this.config.getOrThrow<string>("JWT_REFRESH_SECRET")
      });
    } catch {
      throw new UnauthorizedException("Refresh token is invalid");
    }

    const sessions = await this.prisma.session.findMany({
      where: { userId: payload.sub, revokedAt: null, expiresAt: { gt: new Date() } },
      include: { user: true }
    });

    const session = await firstMatchingSession(sessions, refreshToken);

    if (!session || !session.user.isActive || session.user.deletedAt) {
      throw new UnauthorizedException("Refresh token is invalid");
    }

    const tokens = await this.issueTokens({
      sub: session.user.id,
      email: session.user.email,
      organizationId: session.user.organizationId,
      role: session.user.role,
      permissions: session.user.permissions
    });

    await this.prisma.$transaction([
      this.prisma.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date() }
      }),
      this.prisma.session.create({
        data: {
          userId: session.user.id,
          refreshHash: digestRefreshToken(tokens.refreshToken),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      })
    ]);

    return tokens;
  }

  async logout(userId: string) {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() }
    });
  }

  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      return { ok: true };
    }

    await this.prisma.auditLog.create({
      data: {
        organizationId: user.organizationId,
        userId: user.id,
        action: "PASSWORD_RESET_REQUESTED",
        entityType: "User",
        entityId: user.id
      }
    });

    return { ok: true };
  }

  private async issueTokens(payload: {
    sub: string;
    email: string;
    organizationId: string;
    role: string;
    permissions: string[];
  }) {
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>("JWT_ACCESS_SECRET"),
      expiresIn: this.config.get<string>("JWT_ACCESS_TTL", "15m") as never
    });

    const refreshToken = await this.jwt.signAsync(
      { ...payload, nonce: randomBytes(16).toString("hex") },
      {
        secret: this.config.getOrThrow<string>("JWT_REFRESH_SECRET"),
        expiresIn: this.config.get<string>("JWT_REFRESH_TTL", "7d") as never
      }
    );

    return { accessToken, refreshToken };
  }
}

async function firstMatchingSession<T extends { refreshHash: string }>(sessions: T[], token: string) {
  const digest = digestRefreshToken(token);

  for (const session of sessions) {
    const stored = Buffer.from(session.refreshHash);
    const candidate = Buffer.from(digest);

    if (stored.length === candidate.length && timingSafeEqual(stored, candidate)) {
      return session;
    }
  }

  return null;
}

function digestRefreshToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
