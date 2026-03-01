import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { UpdateWorkspaceSettingsInput } from "./workspaces.dto";

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

  async get(workspaceId: string) {
    return this.prisma.workspace.findUniqueOrThrow({ where: { id: workspaceId } });
  }

  async updateSettings(workspaceId: string, input: UpdateWorkspaceSettingsInput) {
    const updated = await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        retentionDays: input.retentionDays ?? undefined,
        piiRedactionEnabled: input.piiRedactionEnabled ?? undefined,
        encryptionAtRest: input.encryptionAtRest ?? undefined,
        integrations: input.integrations ?? undefined,
        servicesNotes: input.servicesNotes ?? undefined,
        activationViewThreshold: input.activationViewThreshold ?? undefined,
        feedbackScoreThreshold: input.feedbackScoreThreshold ?? undefined,
      },
    });
    await this.prisma.auditEvent.create({
      data: {
        workspaceId,
        actorUserId: "system",
        action: "workspace.settings.updated",
        entityType: "workspace",
        entityId: workspaceId,
        metadata: {
          retentionDays: input.retentionDays ?? null,
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
