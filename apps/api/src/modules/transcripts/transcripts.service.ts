import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { QueueService } from "../../queue/queue.service";
import { CreateTranscriptInput, DetectPiiInput, PiiEntity, RedactTranscriptInput } from "./transcripts.dto";

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
        content: input.content,
        wordTimestamps: input.wordTimestamps ?? undefined,
        diarization: input.diarization ?? undefined,
      },
    });
    await this.queueService.addTranscriptRedaction(transcript.id);
    const normalized = input.content.toLowerCase();
    const tokens = input.content.trim().split(/\s+/).filter(Boolean);
    const wordCount = tokens.length;
    const uniqueWords = new Set(tokens.map((token) => token.toLowerCase())).size;
    const uniqueRatio = wordCount > 0 ? uniqueWords / wordCount : 0;
    const lowEffortPhrases = ["n/a", "no", "none", "idk", "dont know", "don't know", "skip", "na"];
    const lowEffortHits = lowEffortPhrases.reduce((acc, phrase) => {
      return acc + (normalized.includes(phrase) ? 1 : 0);
    }, 0);
    const counts = tokens.reduce<Record<string, number>>((acc, token) => {
      const key = token.toLowerCase();
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
    const maxRepeat = wordCount > 0 ? Math.max(...Object.values(counts)) : 0;
    const repetitionRatio = wordCount > 0 ? maxRepeat / wordCount : 0;
    const uncooperative =
      (wordCount > 0 && wordCount < 15) || lowEffortHits >= 3 || uniqueRatio < 0.2 || repetitionRatio > 0.4;

    if (uncooperative || (wordCount > 0 && wordCount < 40)) {
      const qualityFlag = uncooperative ? "uncooperative" : "low_engagement";
      const qualityScore = uncooperative ? Math.round(uniqueRatio * 100) : wordCount;
      const session = await this.prisma.session.update({
        where: { id: input.sessionId },
        data: { qualityScore, qualityFlag },
        include: { study: true },
      });
      await this.prisma.notification.create({
        data: {
          userId: "demo-user",
          type: "data.quality.flagged",
          payload: {
            sessionId: input.sessionId,
            studyId: session.studyId,
            reason: qualityFlag,
            wordCount,
            uniqueRatio: Math.round(uniqueRatio * 100) / 100,
            lowEffortHits,
          },
        },
      });
      if (uncooperative) {
        await this.prisma.alertEvent.create({
          data: {
            workspaceId: session.study.workspaceId,
            type: "participant.uncooperative",
            severity: "warning",
            payload: {
              sessionId: input.sessionId,
              studyId: session.studyId,
              wordCount,
              uniqueRatio: Math.round(uniqueRatio * 100) / 100,
              lowEffortHits,
              repetitionRatio: Math.round(repetitionRatio * 100) / 100,
            },
          },
        });
      }
    }
    return transcript;
  }

  async redact(transcriptId: string, input: RedactTranscriptInput) {
    return this.prisma.transcript.update({
      where: { id: transcriptId },
      data: {
        redactedContent: input.redactedContent,
        piiDetected: input.piiDetected,
        piiMetadata: input.piiMetadata ? (input.piiMetadata as Prisma.InputJsonValue) : undefined,
      },
    });
  }

  async detectPii(transcriptId: string, input: DetectPiiInput) {
    const transcript = await this.prisma.transcript.findUniqueOrThrow({
      where: { id: transcriptId },
      select: { content: true },
    });
    const locale = input.locale ?? "en";
    const entities = this.findPiiEntities(transcript.content);
    const counts = entities.reduce<Record<string, number>>((acc, entity) => {
      acc[entity.type] = (acc[entity.type] ?? 0) + 1;
      return acc;
    }, {});
    return { transcriptId, locale, entities, counts };
  }

  private findPiiEntities(text: string): PiiEntity[] {
    const entities: PiiEntity[] = [];
    const patterns: Array<{ type: PiiEntity["type"]; regex: RegExp }> = [
      { type: "email", regex: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi },
      { type: "phone", regex: /(\+?\d{1,2}\s?)?(\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/g },
      { type: "ssn", regex: /\b\d{3}-\d{2}-\d{4}\b/g },
      { type: "credit_card", regex: /\b(?:\d[ -]*?){13,16}\b/g },
    ];

    for (const { type, regex } of patterns) {
      let match: RegExpExecArray | null;
      while ((match = regex.exec(text)) !== null) {
        entities.push({
          type,
          start: match.index,
          end: match.index + match[0].length,
          value: match[0],
        });
      }
    }
    return entities.sort((a, b) => a.start - b.start);
  }
}
