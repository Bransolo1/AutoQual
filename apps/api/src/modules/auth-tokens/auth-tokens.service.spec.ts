import { describe, expect, it, vi } from "vitest";
import { AuthTokensService } from "./auth-tokens.service";

describe("AuthTokensService listRevoked", () => {
  it("filters by workspace and status", async () => {
    const prisma = {
      revokedToken: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "revoked-1",
            jti: "token-1",
            userId: "user-1",
            revokedByUserId: "admin-1",
            revokedReason: "compromised",
            expiresAt: new Date("2030-01-01T00:00:00.000Z"),
            createdAt: new Date("2026-01-01T00:00:00.000Z"),
          },
        ]),
      },
    } as any;
    const service = new AuthTokensService(prisma);

    const result = await service.listRevoked({
      workspaceId: "workspace-1",
      status: "active",
      limit: 10,
    });

    expect(prisma.revokedToken.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ workspaceId: "workspace-1" }),
        take: 10,
      }),
    );
    expect(result.items[0]).toEqual(
      expect.objectContaining({
        id: "revoked-1",
        jti: "token-1",
        userId: "user-1",
        revokedByUserId: "admin-1",
        revokedReason: "compromised",
      }),
    );
  });

  it("applies query search and pagination cursor", async () => {
    const prisma = {
      revokedToken: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    } as any;
    const service = new AuthTokensService(prisma);

    await service.listRevoked({
      workspaceId: "workspace-1",
      q: "token",
      cursor: "revoked-10",
      limit: 5,
    });

    expect(prisma.revokedToken.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ jti: expect.any(Object) }),
          ]),
        }),
        cursor: { id: "revoked-10" },
        skip: 1,
        take: 5,
      }),
    );
  });
});
