export type CreateSessionInput = {
  studyId: string;
  participantId: string;
  status: string;
  screeningAnswers?: Record<string, string> | null;
  consented?: boolean;
};
