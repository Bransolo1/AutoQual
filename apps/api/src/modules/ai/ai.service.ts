import { Injectable } from "@nestjs/common";
import { deterministicInsightAdapter } from "../../../../packages/ai-adapters/src/mock";
import { adapters } from "../../../../packages/ai-adapters/src";

type GenerateInsightPayload = {
  studyId: string;
  transcriptText: string;
};

@Injectable()
export class AiService {
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
    return result as {
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
