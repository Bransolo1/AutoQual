import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { QueueService } from "../../queue/queue.service";
import { UpdateWorkspaceSettingsInput } from "./workspaces.dto";

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService, private readonly queueService: QueueService) {}

  async get(workspaceId: string) {
    return this.prisma.workspace.findUniqueOrThrow({ where: { id: workspaceId } });
  }

  async updateSettings(workspaceId: string, input: UpdateWorkspaceSettingsInput) {
    const updated = await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        retentionDays: input.retentionDays ?? undefined,
        auditRetentionEnabled: input.auditRetentionEnabled ?? undefined,
        auditRetentionDays: input.auditRetentionDays ?? undefined,
        piiRedactionEnabled: input.piiRedactionEnabled ?? undefined,
        encryptionAtRest: input.encryptionAtRest ?? undefined,
        integrations: input.integrations ?? undefined,
        servicesNotes: input.servicesNotes ?? undefined,
        activationViewThreshold: input.activationViewThreshold ?? undefined,
        feedbackScoreThreshold: input.feedbackScoreThreshold ?? undefined,
      },
    });
    if (input.auditRetentionEnabled === true) {
      await this.queueService.addAuditRetentionSchedule(workspaceId);
    }
    if (input.auditRetentionEnabled === false) {
      try {
        await this.queueService.removeAuditRetentionSchedule(workspaceId);
      } catch (error) {
        console.warn("Failed to remove audit retention schedule", error);
      }
    }
    await this.prisma.auditEvent.create({
      data: {
        workspaceId,
        actorUserId: "system",
        action: "workspace.settings.updated",
        entityType: "workspace",
        entityId: workspaceId,
        metadata: {
          retentionDays: input.retentionDays ?? null,
          auditRetentionEnabled: input.auditRetentionEnabled ?? null,
          auditRetentionDays: input.auditRetentionDays ?? null,
          piiRedactionEnabled: input.piiRedactionEnabled ?? null,
          encryptionAtRest: input.encryptionAtRest ?? null,
          integrations: input.integrations ?? null,
          servicesNotes: input.servicesNotes ?? null,
          activationViewThreshold: input.activationViewThreshold ?? null,
          feedbackScoreThreshold: input.feedbackScoreThreshold ?? null,
        },
      },
    });
    return updated;
  }
}
