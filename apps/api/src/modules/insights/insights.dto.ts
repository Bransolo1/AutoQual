export type CreateInsightInput = {
  studyId: string;
  statement: string;
  supportingTranscriptSpans: string[];
  supportingVideoClips: string[];
  confidenceScore: number;
  businessImplication: string;
  tags: string[];
  status: "draft" | "in_review" | "approved" | "rejected";
  reviewerComments: string[];
  aiProvider?: string;
  aiModel?: string;
  aiPrompt?: string;
  aiRawResponse?: Record<string, unknown> | null;
  aiRetries?: number;
  aiLatencyMs?: number;
};

export type CreateInsightVersionInput = {
  statement: string;
  supportingTranscriptSpans: string[];
  supportingVideoClips: string[];
  confidenceScore: number;
  businessImplication: string;
  tags: string[];
  reviewerComments: string[];
};

export type AddInsightEvidenceInput = {
  supportingTranscriptSpans?: string[];
  supportingVideoClips?: string[];
};

export type GenerateInsightInput = {
  studyId: string;
  transcriptText: string;
};
