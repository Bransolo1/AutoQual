export type CreateParticipantInput = {
  studyId: string;
  email: string;
  locale?: string;
  source?: string;
  segment?: string;
  deviceFingerprint?: string;
  screeningAnswers?: Record<string, string>;
};

export type RecruitParticipantsInput = {
  studyId: string;
  count: number;
  locale?: string;
  source?: string;
  segment?: string;
  deviceFingerprint?: string;
  screeningAnswers?: Record<string, string>;
};

export type ScreenParticipantInput = {
  studyId: string;
  answers: Record<string, string>;
};

export type VerifyParticipantInput = {
  status: "verified" | "flagged" | "rejected";
  fraudScore?: number;
};

export type VerifyParticipantsBulkInput = {
  ids: string[];
  status: "verified" | "flagged" | "rejected";
  fraudScore?: number;
};
