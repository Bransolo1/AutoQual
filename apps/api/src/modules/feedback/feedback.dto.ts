export type CreateStakeholderFeedbackInput = {
  workspaceId: string;
  projectId: string;
  studyId?: string;
  deliverableType: "report" | "deliverable_pack" | "story";
  deliverableId?: string;
  stakeholderName: string;
  stakeholderRole?: string;
  rating?: number;
  sentiment?: "positive" | "neutral" | "negative";
  notes?: string;
};
