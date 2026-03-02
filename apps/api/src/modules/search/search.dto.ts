export type IndexInsightInput = {
  insightId: string;
};

export type SearchInsightsInput = {
  query: string;
  studyId?: string;
  limit?: number;
};

export type SearchInsightsWithEvidenceInput = {
  query: string;
  studyId?: string;
  limit?: number;
};
