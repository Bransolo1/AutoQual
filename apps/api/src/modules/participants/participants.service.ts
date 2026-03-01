import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import {
  CreateParticipantInput,
  RecruitParticipantsInput,
  VerifyParticipantInput,
  VerifyParticipantsBulkInput,
} from "./participants.dto";

@Injectable()
export class ParticipantsService {
  constructor(private readonly prisma: PrismaService) {}

  async list({
    studyId,
    workspaceId,
    status,
  }: {
    studyId?: string;
    workspaceId?: string;
    status?: string;
  }) {
    return this.prisma.participant.findMany({
      where: {
        ...(studyId ? { studyId } : {}),
        ...(workspaceId ? { study: { workspaceId } } : {}),
        ...(status ? { verificationStatus: status } : {}),
      },
      include: { study: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(input: CreateParticipantInput) {
    return this.prisma.participant.create({
      data: {
        studyId: input.studyId,
        email: input.email,
        locale: input.locale,
        source: input.source,
        segment: input.segment,
      },
    });
  }

  async recruit(input: RecruitParticipantsInput) {
    const count = Math.max(1, Math.min(input.count, 200));
    const participants = await this.prisma.$transaction(
      Array.from({ length: count }, (_, index) =>
        this.prisma.participant.create({
          data: {
            studyId: input.studyId,
            email: `recruit-${Date.now()}-${index}@example.com`,
            locale: input.locale,
            source: input.source ?? "panel",
            segment: input.segment,
          },
        })
      )
    );
    return { created: participants.length, participants };
  }

  async verify(id: string, input: VerifyParticipantInput) {
    const status = input.status;
    const participant = await this.prisma.participant.findUniqueOrThrow({
      where: { id },
      include: { study: true },
    });
    const updated = await this.prisma.participant.update({
      where: { id },
      data: {
        verificationStatus: status,
        fraudScore: input.fraudScore ?? null,
        verifiedAt: new Date(),
      },
    });
    await this.prisma.auditEvent.create({
      data: {
        workspaceId: participant.study.workspaceId,
        actorUserId: "system",
        action: "participant.verification.updated",
        entityType: "participant",
        entityId: id,
        metadata: { status, fraudScore: input.fraudScore ?? null },
      },
    });
    return updated;
  }

  async verifyBulk(input: VerifyParticipantsBulkInput) {
    const ids = Array.from(new Set(input.ids || [])).filter(Boolean);
    if (!ids.length) return { updated: 0 };
    const participants = await this.prisma.participant.findMany({
      where: { id: { in: ids } },
      include: { study: true },
    });
    const updated = await this.prisma.participant.updateMany({
      where: { id: { in: ids } },
      data: {
        verificationStatus: input.status,
        fraudScore: input.fraudScore ?? null,
        verifiedAt: new Date(),
      },
    });
    if (participants.length) {
      await this.prisma.auditEvent.createMany({
        data: participants.map((participant) => ({
          workspaceId: participant.study.workspaceId,
          actorUserId: "system",
          action: "participant.verification.updated",
          entityType: "participant",
          entityId: participant.id,
          metadata: { status: input.status, fraudScore: input.fraudScore ?? null },
        })),
      });
    }
    return { updated: updated.count };
  }
}
