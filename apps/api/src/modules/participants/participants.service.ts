import { BadRequestException, Injectable } from "@nestjs/common";
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
    await this.assertQuota(input.studyId, input.segment, 1);
    await this.assertScreening(input.studyId, input.screeningAnswers);
    return this.prisma.participant.create({
      data: {
        studyId: input.studyId,
        email: input.email,
        locale: input.locale,
        source: input.source,
        segment: input.segment,
        deviceFingerprint: input.deviceFingerprint ?? null,
      },
    });
  }

  async recruit(input: RecruitParticipantsInput) {
    const count = Math.max(1, Math.min(input.count, 200));
    await this.assertQuota(input.studyId, input.segment, count);
    await this.assertScreening(input.studyId, input.screeningAnswers);
    const participants = await this.prisma.$transaction(
      Array.from({ length: count }, (_, index) =>
        this.prisma.participant.create({
          data: {
            studyId: input.studyId,
            email: `recruit-${Date.now()}-${index}@example.com`,
            locale: input.locale,
            source: input.source ?? "panel",
            segment: input.segment,
            deviceFingerprint: input.deviceFingerprint ?? null,
          },
        })
      )
    );
    return { created: participants.length, participants };
  }

  async screen(input: { studyId: string; answers: Record<string, string> }) {
    const study = await this.prisma.study.findUnique({
      where: { id: input.studyId },
      select: { screeningLogic: true },
    });
    const logic = (study?.screeningLogic as Record<string, any> | null) ?? null;
    const outcome = this.evaluateScreening(logic, input.answers ?? {});
    return { outcome };
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

  private async assertQuota(studyId: string, segment?: string | null, requested = 1) {
    const study = await this.prisma.study.findUnique({
      where: { id: studyId },
      select: { quotaTargets: true },
    });
    const targets = (study?.quotaTargets as Record<string, number> | null) ?? null;
    if (!targets) return;
    const key = segment || "unassigned";
    const target = targets[key];
    if (!target && target !== 0) return;
    const current = await this.prisma.participant.count({
      where: { studyId, segment: key },
    });
    if (current + requested > target) {
      throw new BadRequestException("quota_full");
    }
  }

  private async assertScreening(studyId: string, answers?: Record<string, string>) {
    if (!answers) return;
    const study = await this.prisma.study.findUnique({
      where: { id: studyId },
      select: { screeningLogic: true },
    });
    const logic = (study?.screeningLogic as Record<string, any> | null) ?? null;
    const outcome = this.evaluateScreening(logic, answers);
    if (outcome === "screen_out") {
      throw new BadRequestException("screened_out");
    }
  }

  private evaluateScreening(
    logic: Record<string, any> | null,
    answers: Record<string, string>
  ): "ok" | "screen_out" {
    if (!logic) return "ok";
    const required = Array.isArray(logic.requiredFields) ? logic.requiredFields : [];
    for (const field of required) {
      if (!answers[field]) return "screen_out";
    }
    const rules = Array.isArray(logic.screenOutRules) ? logic.screenOutRules : [];
    for (const rule of rules) {
      const field = rule.field as string | undefined;
      const condition = rule.condition as string | undefined;
      const value = rule.value as string | undefined;
      if (!field || !condition) continue;
      const actual = answers[field];
      if (condition === "equals" && actual === value) return "screen_out";
      if (condition === "not_equals" && actual && actual !== value) return "screen_out";
    }
    return "ok";
  }
}
