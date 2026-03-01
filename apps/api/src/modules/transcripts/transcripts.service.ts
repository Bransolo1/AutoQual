import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { QueueService } from "../../queue/queue.service";
import { CreateTranscriptInput, RedactTranscriptInput } from "./transcripts.dto";

@Injectable()
export class TranscriptsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
  ) {}

  async list(sessionId: string) {
    return this.prisma.transcript.findMany({ where: { sessionId } });
  }

  async getById(transcriptId: string) {
    return this.prisma.transcript.findUniqueOrThrow({ where: { id: transcriptId } });
  }

  async create(input: CreateTranscriptInput) {
    const transcript = await this.prisma.transcript.create({
      data: {
        sessionId: input.sessionId,
        content: input.content
      }
    });
    await this.queueService.addTranscriptRedaction(transcript.id);
    const wordCount = input.content.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount > 0 && wordCount < 40) {
      const session = await this.prisma.session.update({
        where: { id: input.sessionId },
        data: { qualityScore: wordCount, qualityFlag: "low_engagement" },
        include: { study: true },
      });
      await this.prisma.notification.create({
        data: {
          userId: "demo-user",
          type: "data.quality.flagged",
          payload: {
            sessionId: input.sessionId,
            studyId: session.studyId,
            reason: "low_engagement",
            wordCount,
          },
        },
      });
    }
    return transcript;
  }

  async redact(transcriptId: string, input: RedactTranscriptInput) {
    return this.prisma.transcript.update({
      where: { id: transcriptId },
      data: {
        redactedContent: input.redactedContent,
        piiDetected: input.piiDetected,
        piiMetadata: input.piiMetadata ?? undefined,
      },
    });
  }
}
