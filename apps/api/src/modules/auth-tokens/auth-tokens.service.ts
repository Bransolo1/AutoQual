import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import {
  ListRevokedTokensQuery,
  RevokedTokenListResponse,
  RevokedTokenStatusFilter,
  RevokeTokenInput,
} from "./auth-tokens.dto";

@Injectable()
export class AuthTokensService {
  constructor(private readonly prisma: PrismaService) {}

  async revoke(input: RevokeTokenInput) {
    const record = await this.prisma.revokedToken.create({
      data: {
        workspaceId: input.workspaceId,
        userId: input.userId ?? null,
        jti: input.jti,
        revokedReason: input.reason ?? null,
        revokedByUserId: input.actorUserId,
        expiresAt: new Date(input.expiresAt),
      },
    });
    await this.prisma.auditEvent.create({
      data: {
        workspaceId: input.workspaceId,
        actorUserId: input.actorUserId,
        action: "token.revoked",
        entityType: "token",
        entityId: record.jti,
        metadata: {
          userId: input.userId ?? null,
          reason: input.reason ?? null,
          expiresAt: input.expiresAt,
        },
      },
    });
    return { revoked: true, jti: record.jti, expiresAt: record.expiresAt };
  }

  async isRevoked(jti: string) {
    const record = await this.prisma.revokedToken.findUnique({
      where: { jti },
      select: { expiresAt: true },
    });
    if (!record) return false;
    return record.expiresAt.getTime() > Date.now();
  }

  async purgeExpired() {
    return this.prisma.revokedToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }

  async listRevoked(query: ListRevokedTokensQuery): Promise<RevokedTokenListResponse> {
    const limit = Math.min(Math.max(query.limit ?? 25, 1), 100);
    const status: RevokedTokenStatusFilter = query.status ?? "all";
    const now = new Date();

    const where = {
      workspaceId: query.workspaceId,
      userId: query.userId ?? undefined,
      ...(query.q
        ? {
            OR: [
              { jti: { contains: query.q, mode: "insensitive" } },
              { revokedReason: { contains: query.q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(status === "active"
        ? { expiresAt: { gt: now } }
        : status === "expired"
          ? { expiresAt: { lte: now } }
          : {}),
    };

    const records = await this.prisma.revokedToken.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit,
      ...(query.cursor ? { skip: 1, cursor: { id: query.cursor } } : {}),
      select: {
        id: true,
        jti: true,
        userId: true,
        revokedByUserId: true,
        revokedReason: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    return {
      items: records.map((record) => ({
        ...record,
        expiresAt: record.expiresAt.toISOString(),
        createdAt: record.createdAt.toISOString(),
      })),
      nextCursor: records.length === limit ? records[records.length - 1]?.id ?? null : null,
    };
  }
}
