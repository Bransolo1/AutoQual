import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AddInsightEvidenceInput, CreateInsightInput, CreateInsightVersionInput } from "./insights.dto";
import { AiService } from "../ai/ai.service";

@Injectable()
export class InsightsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  private hasEvidence(input: { supportingTranscriptSpans: unknown[]; supportingVideoClips: unknown[] }) {
    return (
      (Array.isArray(input.supportingTranscriptSpans) && input.supportingTranscriptSpans.length > 0) ||
      (Array.isArray(input.supportingVideoClips) && input.supportingVideoClips.length > 0)
    );
  }

  async list(studyId: string) {
    return this.prisma.insight.findMany({ where: { studyId }, include: { versions: true } });
  }

  async getById(insightId: string) {
    return this.prisma.insight.findUniqueOrThrow({
      where: { id: insightId },
      include: { versions: true, reviews: { include: { commentEntries: true } } },
    });
  }

  async create(input: CreateInsightInput) {
    if (input.status === "approved" && !this.hasEvidence(input)) {
      throw new BadRequestException("Approved insights require evidence.");
    }
    return this.prisma.$transaction(async (tx) => {
      const insight = await tx.insight.create({
        data: {
          studyId: input.studyId,
          statement: input.statement,
          supportingTranscriptSpans: input.supportingTranscriptSpans,
          supportingVideoClips: input.supportingVideoClips,
          confidenceScore: input.confidenceScore,
          businessImplication: input.businessImplication,
          tags: input.tags,
          status: input.status,
          versionNumber: 1,
          reviewerComments: input.reviewerComments,
        },
      });

      await tx.insightVersion.create({
        data: {
          insightId: insight.id,
          versionNumber: 1,
          content: {
            statement: input.statement,
            supportingTranscriptSpans: input.supportingTranscriptSpans,
            supportingVideoClips: input.supportingVideoClips,
            confidenceScore: input.confidenceScore,
            businessImplication: input.businessImplication,
            tags: input.tags,
          },
          reviewerComments: input.reviewerComments,
        },
      });

      return insight;
    });
  }

  async addVersion(insightId: string, input: CreateInsightVersionInput) {
    return this.prisma.$transaction(async (tx) => {
      const insight = await tx.insight.findUniqueOrThrow({ where: { id: insightId } });
      if (insight.status === "approved" && !this.hasEvidence(input)) {
        throw new BadRequestException("Approved insights require evidence.");
      }
      const nextVersion = insight.versionNumber + 1;
      await tx.insight.update({
        where: { id: insightId },
        data: {
          statement: input.statement,
          supportingTranscriptSpans: input.supportingTranscriptSpans,
          supportingVideoClips: input.supportingVideoClips,
          confidenceScore: input.confidenceScore,
          businessImplication: input.businessImplication,
          tags: input.tags,
          versionNumber: nextVersion,
          reviewerComments: input.reviewerComments,
        },
      });
      return tx.insightVersion.create({
        data: {
          insightId,
          versionNumber: nextVersion,
          content: {
            statement: input.statement,
            supportingTranscriptSpans: input.supportingTranscriptSpans,
            supportingVideoClips: input.supportingVideoClips,
            confidenceScore: input.confidenceScore,
            businessImplication: input.businessImplication,
            tags: input.tags,
          },
          reviewerComments: input.reviewerComments,
        },
      });
    });
  }

  async addEvidence(insightId: string, input: AddInsightEvidenceInput) {
    const insight = await this.prisma.insight.findUniqueOrThrow({ where: { id: insightId } });
    const transcriptSpans = Array.isArray(insight.supportingTranscriptSpans)
      ? (insight.supportingTranscriptSpans as string[])
      : [];
    const videoClips = Array.isArray(insight.supportingVideoClips)
      ? (insight.supportingVideoClips as string[])
      : [];
    const nextTranscriptSpans = input.supportingTranscriptSpans
      ? [...new Set([...transcriptSpans, ...input.supportingTranscriptSpans])]
      : transcriptSpans;
    const nextVideoClips = input.supportingVideoClips
      ? [...new Set([...videoClips, ...input.supportingVideoClips])]
      : videoClips;

    return this.prisma.insight.update({
      where: { id: insightId },
      data: {
        supportingTranscriptSpans: nextTranscriptSpans,
        supportingVideoClips: nextVideoClips,
      },
    });
  }

  async generateFromTranscript(studyId: string, transcriptText: string) {
    const result = await this.aiService.generateInsight({ studyId, transcriptText });
    return this.create({
      studyId,
      statement: result.statement,
      supportingTranscriptSpans: result.supporting_transcript_spans,
      supportingVideoClips: result.supporting_video_clips,
      confidenceScore: result.confidence_score,
      businessImplication: result.business_implication,
      tags: result.tags,
      status: result.status as CreateInsightInput["status"],
      reviewerComments: result.reviewer_comments,
    });
  }

  getTemplates() {
    return [
      {
        id: "customer-journey",
        title: "Customer Journey",
        fields: ["moment", "emotion", "friction", "opportunity"],
      },
      {
        id: "concept-testing",
        title: "Concept Testing",
        fields: ["appeal", "clarity", "differentiation", "barriers"],
      },
      {
        id: "creative-eval",
        title: "Creative Evaluation",
        fields: ["attention", "message", "brand-fit", "improvements"],
      },
    ];
  }
}
