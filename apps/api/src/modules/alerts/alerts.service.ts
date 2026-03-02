import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateAlertInput, CreateAlertViewInput } from "./alerts.dto";

@Injectable()
export class AlertsService {
  constructor(private readonly prisma: PrismaService) {}

  list(workspaceId: string, filters?: { type?: string; severity?: string; from?: Date; to?: Date; limit?: number }) {
    return this.prisma.alertEvent.findMany({
      where: {
        workspaceId,
        ...(filters?.type ? { type: filters.type } : {}),
        ...(filters?.severity ? { severity: filters.severity } : {}),
        ...(filters?.from || filters?.to
          ? { createdAt: { gte: filters.from ?? undefined, lte: filters.to ?? undefined } }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: filters?.limit,
    });
  }

  async create(input: CreateAlertInput) {
    const alert = await this.prisma.alertEvent.create({
      data: {
        workspaceId: input.workspaceId,
        type: input.type,
        severity: input.severity,
        payload: input.payload as Prisma.InputJsonValue,
      },
    });
    await this.prisma.auditEvent.create({
      data: {
        workspaceId: input.workspaceId,
        actorUserId: "system",
        action: "alert.created",
        entityType: "alert",
        entityId: alert.id,
        metadata: { type: input.type, severity: input.severity },
      },
    });
    return alert;
  }

  listViews(workspaceId: string) {
    return this.prisma.alertView.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
    });
  }

  async createView(input: CreateAlertViewInput) {
    return this.prisma.alertView.create({
      data: {
        workspaceId: input.workspaceId,
        name: input.name,
        createdByUserId: input.createdByUserId,
        filters: input.filters as Prisma.InputJsonValue,
      },
    });
  }

  async deleteView(viewId: string) {
    return this.prisma.alertView.delete({ where: { id: viewId } });
  }
}
