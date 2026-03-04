import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateSessionInput } from "./sessions.dto";
import { isValidSessionTransition } from "./session-state";
import { QueueService } from "../../queue/queue.service";

@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
  ) {}

  async list(studyId: string) {
    const sessions = await this.prisma.session.findMany({
      where: { studyId },
      include: {
        participant: { select: { email: true, segment: true } },
        _count: { select: { turns: true } },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });
    return sessions.map((s) => ({
      ...s,
      participantEmail: s.participant?.email ?? null,
      segment: s.participant?.segment ?? null,
      turnCount: s._count.turns,
    }));
  }

  async listTurns(sessionId: string) {
    return this.prisma.turn.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
      select: { id: true, speaker: true, content: true, createdAt: true },
    });
  }

  async getById(sessionId: string) {
    return this.prisma.session.findUniqueOrThrow({ where: { id: sessionId } });
  }

  async create(input: CreateSessionInput) {
    const study = await this.prisma.study.findUnique({
      where: { id: input.studyId },
    });
    if (!study) {
      throw new BadRequestException("study_not_found");
    }
    if (!study.allowMultipleEntries) {
      const existing = await this.prisma.session.findFirst({
        where: { studyId: input.studyId, participantId: input.participantId },
      });
      if (existing) {
        throw new BadRequestException("participant_already_in_study");
      }
    }
    let status = input.status;
    if (study.screeningLogic && input.screeningAnswers) {
      const screeningLogic = (study.screeningLogic ?? {}) as Record<string, unknown>;
      const requiredFields = Array.isArray(screeningLogic["requiredFields"])
        ? (screeningLogic["requiredFields"] as string[])
        : [];
      const missing = requiredFields.filter(
        (field) => !input.screeningAnswers?.[field]
      );
      if (missing.length > 0 && !study.allowIncomplete) {
        status = "screened_out";
      }
      const screenOutRules = Array.isArray(screeningLogic["screenOutRules"])
        ? (screeningLogic["screenOutRules"] as Array<Record<string, string>>)
        : [];
      for (const rule of screenOutRules) {
        const field = rule.field;
        const value = rule.value;
        const condition = rule.condition;
        if (field && condition === "equals" && input.screeningAnswers?.[field] === value) {
          status = "screened_out";
          break;
        }
      }
    }
    const session = await this.prisma.session.create({
      data: {
        studyId: input.studyId,
        participantId: input.participantId,
        status,
        consented: input.consented ?? false,
      },
    });
    if (input.status === "completed") {
      await this.onSessionCompleted(session.id);
    }
    return session;
  }

  async updateStatus(sessionId: string, status: string) {
    const current = await this.prisma.session.findUnique({ where: { id: sessionId } });
    if (!current) {
      throw new BadRequestException("session_not_found");
    }
    if (!isValidSessionTransition(current.status, status)) {
      throw new BadRequestException("invalid_status_transition");
    }
    const session = await this.prisma.session.update({
      where: { id: sessionId },
      data: { status },
      include: { study: true },
    });
    if (status === "completed") {
      await this.onSessionCompleted(sessionId);
    }
    return session;
  }

  async captureConsent(sessionId: string) {
    const session = await this.prisma.session.update({
      where: { id: sessionId },
      data: { consented: true, status: "consented" },
    });
    return session;
  }

  private async onSessionCompleted(sessionId: string) {
    const session = await this.prisma.session.findUniqueOrThrow({
      where: { id: sessionId },
      include: { study: { include: { project: true } } },
    });
    await this.queueService.addTranscriptionJob(sessionId);
    const projectId = session.study.projectId;
    const studyId = session.studyId;
    const fieldworkTask = await this.prisma.task.findFirst({
      where: { projectId, title: { contains: "interview" }, status: { not: "done" } },
    });
    if (fieldworkTask) {
      await this.prisma.task.update({
        where: { id: fieldworkTask.id },
        data: { status: "done" },
      });
    }
    const approval = await this.prisma.approval.create({
      data: {
        linkedEntityType: "insight_set",
        linkedEntityId: studyId,
        status: "requested",
        requestedByUserId: session.participantId,
      },
    });
    await this.prisma.auditEvent.create({
      data: {
        workspaceId: session.study.workspaceId,
        actorUserId: "system",
        action: "approval.created",
        entityType: "approval",
        entityId: approval.id,
        metadata: { linkedEntityType: "insight_set", linkedEntityId: studyId },
      },
    });
    await this.prisma.notification.create({
      data: {
        userId: "demo-user",
        type: "approval.requested",
        payload: { approvalType: "insight_set", studyId },
      },
    });
  }
}
