export type UpdateWorkspaceSettingsInput = {
  retentionDays?: number;
  piiRedactionEnabled?: boolean;
  encryptionAtRest?: boolean;
  integrations?: Record<string, string | null>;
  servicesNotes?: string;
  activationViewThreshold?: number;
  feedbackScoreThreshold?: number;
};
