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
      "You are a senior qualitative researcher with 15 years of experience in consumer and enterprise research.",
      "Your task is to extract ONE key insight from the interview transcript below.",
      "",
      "INSIGHT CRITERIA:",
      "- statement: One clear, evidence-based sentence capturing a non-obvious finding. Begin with 'Participants...' or 'Users...' or a specific behavioural observation. Avoid vague generalisations.",
      "- business_implication: One actionable sentence describing what a product, design, or strategy team should do with this finding.",
      "- confidence_score: 0.0–1.0. Use 0.85+ only when multiple participants expressed the same idea unprompted. Use 0.5–0.7 for single mentions or partial evidence.",
      "- tags: 3–5 lowercase kebab-case labels (e.g. 'onboarding', 'trust', 'price-sensitivity'). No generic tags like 'feedback' or 'interview'.",
      "- supporting_transcript_spans: Verbatim quotes (under 25 words each) from the transcript that directly support the insight. Provide at least one.",
      "- supporting_video_clips: Leave as empty array [].",
      "- status: Always 'draft'.",
      "- reviewer_comments: Always empty array [].",
      "",
      "OUTPUT: Return ONLY valid JSON. No markdown, no code fences, no additional text.",
      "",
      `{
  "statement": string,
  "supporting_transcript_spans": string[],
  "supporting_video_clips": string[],
  "confidence_score": number,
  "business_implication": string,
  "tags": string[],
  "status": "draft",
  "reviewer_comments": []
}`,
      "",
      "TRANSCRIPT:",
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
