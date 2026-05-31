import { UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { hash } from "bcryptjs";
import { AuthService } from "./auth.service";

describe("AuthService refresh", () => {
  const user = {
    id: "user-1",
    email: "admin@ledgent.ai",
    organizationId: "org-1",
    role: "FINANCE_ADMIN",
    permissions: ["dashboard:read"],
    isActive: true,
    deletedAt: null
  };

  function createService() {
    const prisma = {
      session: {
        findMany: jest.fn(),
        update: jest.fn((args: unknown) => args),
        create: jest.fn((args: unknown) => args)
      },
      $transaction: jest.fn()
    };
    const jwt = {
      verifyAsync: jest.fn(),
      signAsync: jest.fn()
    };
    const config = {
      getOrThrow: jest.fn((key: string) => `${key}-value-with-enough-length`),
      get: jest.fn((_key: string, fallback: string) => fallback)
    };

    return {
      config,
      jwt,
      prisma,
      service: new AuthService(prisma as never, jwt as unknown as JwtService, config as unknown as ConfigService)
    };
  }

  it("verifies the token, narrows the session lookup, and rotates the matched session", async () => {
    const { service, jwt, prisma } = createService();
    const refreshToken = "refresh-token-value-with-enough-length";
    jwt.verifyAsync.mockResolvedValue({ sub: user.id });
    jwt.signAsync.mockResolvedValueOnce("new-access-token").mockResolvedValueOnce("new-refresh-token");
    prisma.session.findMany.mockResolvedValue([
      {
        id: "session-1",
        userId: user.id,
        user,
        refreshHash: await hash(refreshToken, 4)
      }
    ]);

    await expect(service.refresh(refreshToken)).resolves.toEqual({
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token"
    });
    expect(prisma.session.findMany).toHaveBeenCalledWith({
      where: { userId: user.id, revokedAt: null, expiresAt: { gt: expect.any(Date) } },
      include: { user: true }
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it("rejects refresh tokens with invalid signatures before querying sessions", async () => {
    const { service, jwt, prisma } = createService();
    jwt.verifyAsync.mockRejectedValue(new Error("invalid signature"));

    await expect(service.refresh("invalid-refresh-token-value-with-enough-length")).rejects.toBeInstanceOf(
      UnauthorizedException
    );
    expect(prisma.session.findMany).not.toHaveBeenCalled();
  });
});
