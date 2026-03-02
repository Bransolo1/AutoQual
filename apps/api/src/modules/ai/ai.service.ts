import { BadRequestException, Injectable } from "@nestjs/common";
import Joi from "joi";
import { deterministicInsightAdapter } from "../../../../../packages/ai-adapters/src/mock";
import { adapters } from "../../../../../packages/ai-adapters/src";

type GenerateInsightPayload = {
  studyId: string;
  transcriptText: string;
};

@Injectable()
export class AiService {
  private insightSchema = Joi.object({
    statement: Joi.string().min(3).required(),
    supporting_transcript_spans: Joi.array().items(Joi.string()).required(),
    supporting_video_clips: Joi.array().items(Joi.string()).required(),
    confidence_score: Joi.number().min(0).max(1).required(),
    business_implication: Joi.string().min(3).required(),
    tags: Joi.array().items(Joi.string()).min(1).required(),
    status: Joi.string().valid("draft", "in_review", "approved", "rejected").required(),
    reviewer_comments: Joi.array().items(Joi.string()).required(),
  });

  async generateInsight(payload: GenerateInsightPayload) {
    const provider = process.env.AI_PROVIDER || "mock";
    if (provider === "openai") {
      await adapters.openai({ transcriptText: payload.transcriptText });
    } else if (provider === "anthropic") {
      await adapters.anthropic({ transcriptText: payload.transcriptText });
    }
    const result = await deterministicInsightAdapter({
      studyId: payload.studyId,
      transcriptText: payload.transcriptText,
    });
    const { error, value } = this.insightSchema.validate(result);
    if (error) {
      throw new BadRequestException("invalid_insight_payload");
    }
    return value as {
      statement: string;
      supporting_transcript_spans: string[];
      supporting_video_clips: string[];
      confidence_score: number;
      business_implication: string;
      tags: string[];
      status: string;
      reviewer_comments: string[];
    };
  }
}
