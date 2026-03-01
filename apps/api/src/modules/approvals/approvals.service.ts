import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateApprovalInput, UpdateApprovalStatusInput } from "./approvals.dto";

@Injectable()
export class ApprovalsService {
  constructor(private readonly prisma: PrismaService) {}

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
        status: status || undefined,
        linkedEntityType: linkedEntityType || undefined,
      },
      orderBy: { decidedAt: "desc" },
    });
  }

  async create(input: CreateApprovalInput) {
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
