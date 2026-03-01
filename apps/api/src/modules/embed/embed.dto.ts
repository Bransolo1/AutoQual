export type CreateEmbedTokenInput = {
  studyId: string;
  expiresInMinutes?: number;
};

export type EmbedCompletionInput = {
  participantId?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
};
