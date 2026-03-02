import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { RevokeTokenInput } from "./auth-tokens.dto";

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
}
