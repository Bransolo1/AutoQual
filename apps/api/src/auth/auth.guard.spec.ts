import { describe, expect, it, vi } from "vitest";
import { UnauthorizedException } from "@nestjs/common";
import { SignJWT } from "jose";
import { AuthGuard } from "./auth.guard";

const makeContext = (headers: Record<string, string>) =>
  ({
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({
      getRequest: () => ({ headers }),
    }),
  }) as any;

describe("AuthGuard", () => {
  it("rejects header impersonation without bearer token", async () => {
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue(false) } as any;
    const prisma = { revokedToken: { findUnique: vi.fn() } } as any;
    const guard = new AuthGuard(reflector, prisma);

    await expect(
      guard.canActivate(
        makeContext({
          "x-user-id": "demo-user",
          "x-workspace-id": "demo-workspace",
        }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("accepts a valid signed token", async () => {
    process.env.JWT_SECRET = "test-secret";
    process.env.JWT_ALGORITHM = "HS256";
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue(false) } as any;
    const prisma = { revokedToken: { findUnique: vi.fn().mockResolvedValue(null) } } as any;
    const guard = new AuthGuard(reflector, prisma);

    const token = await new SignJWT({ workspaceId: "workspace-1", role: "admin" })
      .setSubject("user-1")
      .setIssuedAt()
      .setExpirationTime("2h")
      .setJti("token-1")
      .setProtectedHeader({ alg: "HS256" })
      .sign(new TextEncoder().encode("test-secret"));

    const result = await guard.canActivate(
      makeContext({
        authorization: `Bearer ${token}`,
      }),
    );

    expect(result).toBe(true);
  });
});
