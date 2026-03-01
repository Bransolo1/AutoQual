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

  async exportCsv({
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
    const events = await this.list({ workspaceId, entityType, entityId, limit });
    const rows = [
      ["id", "workspaceId", "actorUserId", "action", "entityType", "entityId", "requestId", "createdAt"],
      ...events.map((event) => [
        event.id,
        event.workspaceId,
        event.actorUserId,
        event.action,
        event.entityType,
        event.entityId,
        event.requestId ?? "",
        event.createdAt.toISOString(),
      ]),
    ];
    return rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
  }

  async applyRetention(workspaceId: string, retentionDays?: number) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { retentionDays: true },
    });
    const days =
      typeof retentionDays === "number"
        ? retentionDays
        : typeof workspace?.retentionDays === "number"
          ? workspace.retentionDays
          : Number(process.env.AUDIT_RETENTION_DAYS ?? 365);
    const cutoff = new Date(Date.now() - days * 86400000);
    return this.prisma.auditEvent.deleteMany({
      where: {
        workspaceId,
        createdAt: { lt: cutoff },
      },
    });
  }
}
