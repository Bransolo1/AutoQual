import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateStakeholderFeedbackInput } from "./feedback.dto";

@Injectable()
export class FeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  list(projectId: string) {
    return this.prisma.stakeholderFeedback.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(input: CreateStakeholderFeedbackInput) {
    const feedback = await this.prisma.stakeholderFeedback.create({
      data: {
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        studyId: input.studyId,
        deliverableType: input.deliverableType,
        deliverableId: input.deliverableId,
        stakeholderName: input.stakeholderName,
        stakeholderRole: input.stakeholderRole,
        rating: input.rating,
        sentiment: input.sentiment,
        notes: input.notes,
      },
    });
    await this.prisma.auditEvent.create({
      data: {
        workspaceId: input.workspaceId,
        actorUserId: "system",
        action: "feedback.created",
        entityType: "stakeholder_feedback",
        entityId: feedback.id,
        metadata: {
          projectId: input.projectId,
          deliverableType: input.deliverableType,
          deliverableId: input.deliverableId ?? null,
        },
      },
    });
    return feedback;
  }
}
