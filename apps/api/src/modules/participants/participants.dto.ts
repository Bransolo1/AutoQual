export type CreateParticipantInput = {
  studyId: string;
  email: string;
  locale?: string;
  source?: string;
  segment?: string;
};

export type RecruitParticipantsInput = {
  studyId: string;
  count: number;
  locale?: string;
  source?: string;
  segment?: string;
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
