export type CreateThemeInput = {
  studyId: string;
  label: string;
};

export type GenerateThemesInput = {
  studyId: string;
};

export type ThemeSegment = {
  segment: string;
  insightCount: number;
};
