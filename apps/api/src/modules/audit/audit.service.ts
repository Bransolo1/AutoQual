import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { getSignedMediaUrl, putObject } from "../../common/s3.client";

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

  async exportToStorage({
    workspaceId,
    entityType,
    entityId,
    limit,
    actorUserId,
  }: {
    workspaceId: string;
    entityType?: string;
    entityId?: string;
    limit?: number;
    actorUserId: string;
  }) {
    const csv = await this.exportCsv({ workspaceId, entityType, entityId, limit });
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const storageKey = `audit/exports/${workspaceId}/audit-${timestamp}.csv`;
    await putObject(storageKey, csv, "text/csv");
    const url = await getSignedMediaUrl(storageKey);
    await this.prisma.auditEvent.create({
      data: {
        workspaceId,
        actorUserId,
        action: "audit.exported",
        entityType: "audit",
        entityId: storageKey,
        metadata: { storageKey, entityType, entityId, limit },
      },
    });
    return { storageKey, url };
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
