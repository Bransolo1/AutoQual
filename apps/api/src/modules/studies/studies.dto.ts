export type CreateStudyInput = {
  workspaceId: string;
  projectId: string;
  name: string;
  status: string;
  language?: string;
  mode?: string;
  allowMultipleEntries?: boolean;
  allowIncomplete?: boolean;
  screeningLogic?: Record<string, unknown> | null;
  interviewGuide?: Record<string, unknown> | null;
  syntheticEnabled?: boolean;
  quotaTargets?: Record<string, number> | null;
  localizationChecklist?: Record<string, boolean> | null;
  recruitmentChecklist?: Record<string, boolean> | null;
  activationChecklist?: Record<string, boolean> | null;
  rolloutPlan?: { markets: string[]; status?: string } | null;
  distributionTracking?: { channels: string[]; measurement?: string } | null;
  deliveryHealth?: { score: number; status: string; notes?: string } | null;
};

export type UpdateLocalizationChecklistInput = {
  checklist: Record<string, boolean>;
};

export type UpdateRecruitmentChecklistInput = {
  checklist: Record<string, boolean>;
};

export type UpdateActivationChecklistInput = {
  checklist: Record<string, boolean>;
};

export type UpdateRolloutPlanInput = {
  rolloutPlan: { markets: string[]; status?: string };
};

export type UpdateDistributionTrackingInput = {
  distributionTracking: { channels: string[]; measurement?: string };
};

export type UpdateDeliveryHealthInput = {
  deliveryHealth: { score: number; status: string; notes?: string };
};

export type UpdateQuotaTargetsInput = {
  quotaTargets: Record<string, number>;
};

export type UpdateInterviewGuideInput = {
  guide: Record<string, unknown>;
};
