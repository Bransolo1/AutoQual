export type IndexInsightInput = {
  insightId: string;
};

export type IndexTranscriptInput = {
  transcriptId: string;
};

export type IndexThemeInput = {
  themeId: string;
};

export type IndexStoryInput = {
  storyId: string;
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

export type SearchAllInput = {
  query: string;
  studyId?: string;
  limit?: number;
};
