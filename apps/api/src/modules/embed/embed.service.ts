import { Injectable, UnauthorizedException } from "@nestjs/common";
import { createHmac } from "crypto";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

type TokenPayload = {
  studyId: string;
  exp: number;
};

@Injectable()
export class EmbedService {
  constructor(private readonly prisma: PrismaService) {}

  private get secret() {
    return process.env.EMBED_SECRET ?? "embed-secret";
  }

  private get webhookUrl() {
    return process.env.EMBED_COMPLETION_WEBHOOK_URL ?? "";
  }

  createToken(studyId: string, expiresInMinutes = 60) {
    const payload: TokenPayload = {
      studyId,
      exp: Date.now() + expiresInMinutes * 60 * 1000,
    };
    const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = createHmac("sha256", this.secret).update(data).digest("base64url");
    return `${data}.${signature}`;
  }

  verifyToken(token: string): TokenPayload {
    const [data, signature] = token.split(".");
    if (!data || !signature) throw new UnauthorizedException("Invalid token");
    const expected = createHmac("sha256", this.secret).update(data).digest("base64url");
    if (expected !== signature) throw new UnauthorizedException("Invalid token");
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8")) as TokenPayload;
    if (payload.exp < Date.now()) throw new UnauthorizedException("Token expired");
    return payload;
  }

  async notifyCompletion(studyId: string, payload: Record<string, unknown>) {
    try {
      const study = await this.prisma.study.findUnique({
        where: { id: studyId },
        select: { workspaceId: true, projectId: true },
      });
      if (study) {
        // Look up the workspace's first admin to notify; fall back to "system"
        const adminUser = await this.prisma.user.findFirst({
          where: { workspaceId: study.workspaceId },
          orderBy: { createdAt: "asc" },
          select: { id: true },
        }).catch(() => null);
        await this.prisma.notification.create({
          data: {
            userId: adminUser?.id ?? "system",
            type: "embed.completed",
            payload: { studyId, projectId: study.projectId, ...payload },
          },
        });
        await this.prisma.auditEvent.create({
          data: {
            workspaceId: study.workspaceId,
            actorUserId: "system",
            action: "embed.completed",
            entityType: "study",
            entityId: studyId,
            metadata: payload as Prisma.InputJsonValue,
          },
        });
      }
    } catch {
      // best-effort: completion logging shouldn't block webhook
    }
    if (!this.webhookUrl) {
      return { delivered: false, reason: "EMBED_COMPLETION_WEBHOOK_URL not set" };
    }
    try {
      const res = await fetch(this.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studyId, ...payload }),
      });
      return { delivered: res.ok, status: res.status };
    } catch (error) {
      return { delivered: false, reason: "request_failed", error: String(error) };
    }
  }

  async createSession(
    studyId: string,
    input: { email: string; locale?: string; source?: string; segment?: string; consented?: boolean }
  ) {
    const participant = await this.prisma.participant.create({
      data: {
        studyId,
        email: input.email,
        locale: input.locale ?? null,
        source: input.source ?? "embed",
        segment: input.segment ?? null,
      },
    });
    const session = await this.prisma.session.create({
      data: {
        studyId,
        participantId: participant.id,
        status: "in_progress",
        consented: input.consented ?? false,
      },
    });
    return { participantId: participant.id, sessionId: session.id };
  }

  async recordTurn(input: { sessionId: string; speaker: string; content: string }) {
    return this.prisma.turn.create({
      data: {
        sessionId: input.sessionId,
        speaker: input.speaker,
        content: input.content,
      },
    });
  }

  async createTranscript(input: { sessionId: string; content: string }) {
    return this.prisma.transcript.create({
      data: {
        sessionId: input.sessionId,
        content: input.content,
      },
    });
  }

  async getStudyInfo(token: string) {
    const { studyId } = this.verifyToken(token);
    const study = await this.prisma.study.findUnique({
      where: { id: studyId },
      select: { id: true, name: true, mode: true, language: true, interviewGuide: true },
    });
    if (!study) throw new UnauthorizedException("Study not found");

    type GuideQuestion = { id?: string; prompt: string; type?: string; followUp?: string };
    const guide = study.interviewGuide as GuideQuestion[] | null;
    const questions = (Array.isArray(guide) ? guide : []).map((q, i) => ({
      id: q.id ?? `q${i}`,
      prompt: q.prompt ?? "",
      type: q.type ?? "text",
      followUp: q.followUp ?? null,
    }));

    return {
      studyId: study.id,
      studyName: study.name,
      mode: study.mode,
      language: study.language,
      estimatedMinutes: Math.max(5, Math.ceil(questions.length * 2)),
      questions,
    };
  }

  async updateConsent(input: { sessionId: string; consented: boolean }) {
    return this.prisma.session.update({
      where: { id: input.sessionId },
      data: {
        consented: input.consented,
        status: input.consented ? "in_progress" : "pending_consent",
      },
    });
  }
}
