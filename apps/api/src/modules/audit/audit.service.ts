import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async list({
    workspaceId,
    entityType,
    entityId,
    limit,
  }: {
    workspaceId: string;
    entityType?: string;
    entityId?: string;
    limit?: number;
  }) {
    return this.prisma.auditEvent.findMany({
      where: {
        workspaceId,
        entityType: entityType || undefined,
        entityId: entityId || undefined,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
}
