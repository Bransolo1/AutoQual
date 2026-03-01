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

export type GenerateInsightInput = {
  studyId: string;
  transcriptText: string;
};
