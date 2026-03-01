import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateAlertInput } from "./alerts.dto";

@Injectable()
export class AlertsService {
  constructor(private readonly prisma: PrismaService) {}

  list(workspaceId: string) {
    return this.prisma.alertEvent.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(input: CreateAlertInput) {
    const alert = await this.prisma.alertEvent.create({
      data: {
        workspaceId: input.workspaceId,
        type: input.type,
        severity: input.severity,
        payload: input.payload,
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
}
