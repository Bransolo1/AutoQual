import { BadRequestException, Injectable } from "@nestjs/common";
import { ApprovalStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateApprovalInput, UpdateApprovalStatusInput } from "./approvals.dto";
import { isValidApprovalTransition } from "./approval-state";

@Injectable()
export class ApprovalsService {
  constructor(private readonly prisma: PrismaService) {}

  private hasEvidence(insight: { supportingTranscriptSpans?: unknown; supportingVideoClips?: unknown }) {
    const spans = Array.isArray(insight.supportingTranscriptSpans) ? insight.supportingTranscriptSpans : [];
    const clips = Array.isArray(insight.supportingVideoClips) ? insight.supportingVideoClips : [];
    return spans.length > 0 || clips.length > 0;
  }

  async list({
    linkedEntityId,
    status,
    linkedEntityType,
    approvalId,
  }: {
    linkedEntityId?: string;
    status?: string;
    linkedEntityType?: string;
    approvalId?: string;
  }) {
    return this.prisma.approval.findMany({
      where: {
        id: approvalId || undefined,
        linkedEntityId: linkedEntityId || undefined,
        status: status ? (status as ApprovalStatus) : undefined,
        linkedEntityType: linkedEntityType || undefined,
      },
      orderBy: { decidedAt: "desc" },
    });
  }

  async create(input: CreateApprovalInput) {
    if (input.status === "approved" && input.linkedEntityType === "insight_set") {
      const insights = await this.prisma.insight.findMany({
        where: { studyId: input.linkedEntityId },
        select: { supportingTranscriptSpans: true, supportingVideoClips: true },
      });
      if (insights.length === 0 || insights.some((insight) => !this.hasEvidence(insight))) {
        throw new BadRequestException("insight_set_requires_evidence");
      }
    }
    const approval = await this.prisma.approval.create({
      data: {
        linkedEntityType: input.linkedEntityType,
        linkedEntityId: input.linkedEntityId,
        status: input.status,
        requestedByUserId: input.requestedByUserId,
        decidedByUserId: input.decidedByUserId ?? null,
        decisionNote: input.decisionNote ?? null,
        decidedAt: input.decidedAt ? new Date(input.decidedAt) : null,
      },
    });
    if (approval.status === "requested") {
      await this.prisma.notification.create({
        data: {
          userId: approval.requestedByUserId,
          type: "approval.requested",
          payload: {
            approvalId: approval.id,
            linkedEntityType: approval.linkedEntityType,
            linkedEntityId: approval.linkedEntityId,
          },
        },
      });
    }
    if (input.workspaceId && input.actorUserId) {
      await this.prisma.auditEvent.create({
        data: {
          workspaceId: input.workspaceId,
          actorUserId: input.actorUserId,
          action: "approval.created",
          entityType: "approval",
          entityId: approval.id,
          metadata: {
            status: approval.status,
            linkedEntityType: approval.linkedEntityType,
            linkedEntityId: approval.linkedEntityId,
          },
        },
      });
    }
    return approval;
  }

  async updateStatus(approvalId: string, input: UpdateApprovalStatusInput) {
    const current = await this.prisma.approval.findUnique({ where: { id: approvalId } });
    if (!current) {
      throw new BadRequestException("approval_not_found");
    }
    if (!isValidApprovalTransition(current.status, input.status)) {
      throw new BadRequestException("invalid_approval_transition");
    }
    if (input.status === "approved" && current.linkedEntityType === "insight_set") {
      const insights = await this.prisma.insight.findMany({
        where: { studyId: current.linkedEntityId },
        select: { supportingTranscriptSpans: true, supportingVideoClips: true },
      });
      if (insights.length === 0 || insights.some((insight) => !this.hasEvidence(insight))) {
        throw new BadRequestException("insight_set_requires_evidence");
      }
    }
    const approval = await this.prisma.approval.update({
      where: { id: approvalId },
      data: {
        status: input.status,
        decidedByUserId: input.decidedByUserId,
        decisionNote: input.decisionNote ?? null,
        decidedAt: new Date(),
      },
    });

    await this.prisma.auditEvent.create({
      data: {
        workspaceId: input.workspaceId,
        actorUserId: input.actorUserId,
        action: "approval.status.updated",
        entityType: "approval",
        entityId: approvalId,
        metadata: { status: input.status, decisionNote: input.decisionNote ?? null },
      },
    });

    await this.prisma.notification.create({
      data: {
        userId: approval.requestedByUserId,
        type: "approval.decision",
        payload: {
          approvalId,
          linkedEntityType: approval.linkedEntityType,
          linkedEntityId: approval.linkedEntityId,
          status: approval.status,
        },
      },
    });

    await this.prisma.notification.create({
      data: {
        userId: input.actorUserId,
        type: "approval.decision",
        payload: {
          approvalId,
          linkedEntityType: approval.linkedEntityType,
          linkedEntityId: approval.linkedEntityId,
          status: approval.status,
        },
      },
    });

    return approval;
  }
}
