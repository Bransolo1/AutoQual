import { BadRequestException, Injectable } from "@nestjs/common";
import Joi from "joi";
import { deterministicInsightAdapter } from "../../../../../packages/ai-adapters/src/mock";
import { adapters } from "../../../../../packages/ai-adapters/src";

type GenerateInsightPayload = {
  studyId: string;
  transcriptText: string;
};

type InsightResult = {
  statement: string;
  supporting_transcript_spans: string[];
  supporting_video_clips: string[];
  confidence_score: number;
  business_implication: string;
  tags: string[];
  status: string;
  reviewer_comments: string[];
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

  private buildInsightPrompt(transcriptText: string) {
    return [
      "You are an insight extraction service.",
      "Return ONLY valid JSON that matches this schema:",
      `{
  "statement": string,
  "supporting_transcript_spans": string[],
  "supporting_video_clips": string[],
  "confidence_score": number (0-1),
  "business_implication": string,
  "tags": string[],
  "status": "draft" | "in_review" | "approved" | "rejected",
  "reviewer_comments": string[]
}`,
      "No markdown, no code fences, no additional text.",
      "Transcript:",
      transcriptText,
    ].join("\n");
  }

  async generateInsight(payload: GenerateInsightPayload) {
    const provider = process.env.AI_PROVIDER || "mock";
    const maxAttempts = Number(process.env.AI_INSIGHT_MAX_ATTEMPTS ?? 3);
    const startTime = Date.now();
    let lastError: unknown = null;
    let rawResult: unknown = null;
    const prompt = this.buildInsightPrompt(payload.transcriptText);
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        if (provider === "openai") {
          const adapterResult = await adapters.openai({
            transcriptText: payload.transcriptText,
            prompt,
          });
          if (adapterResult.status === "not_configured") {
            rawResult = await deterministicInsightAdapter({
              studyId: payload.studyId,
              transcriptText: payload.transcriptText,
            });
          } else {
            rawResult = adapterResult.result ?? adapterResult.raw ?? adapterResult;
          }
        } else if (provider === "anthropic") {
          const adapterResult = await adapters.anthropic({
            transcriptText: payload.transcriptText,
            prompt,
          });
          if (adapterResult.status === "not_configured") {
            rawResult = await deterministicInsightAdapter({
              studyId: payload.studyId,
              transcriptText: payload.transcriptText,
            });
          } else {
            rawResult = adapterResult.result ?? adapterResult.raw ?? adapterResult;
          }
        } else {
          rawResult = await deterministicInsightAdapter({
            studyId: payload.studyId,
            transcriptText: payload.transcriptText,
          });
        }
        const { error, value } = this.insightSchema.validate(rawResult);
        if (error) {
          lastError = error;
          continue;
        }
        const latencyMs = Date.now() - startTime;
        return {
          value: value as InsightResult,
          meta: {
            provider,
            model: process.env.AI_MODEL ?? null,
            prompt,
            rawResponse: rawResult,
            retries: attempt - 1,
            latencyMs,
          },
        };
      } catch (error) {
        lastError = error;
      }
    }
    throw new BadRequestException("invalid_insight_payload");
  }
}
