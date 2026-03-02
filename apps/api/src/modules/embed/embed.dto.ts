export type CreateEmbedTokenInput = {
  studyId: string;
  expiresInMinutes?: number;
};

export type EmbedCompletionInput = {
  participantId?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
};

export type EmbedSessionInput = {
  email: string;
  locale?: string;
  source?: string;
  segment?: string;
  consented?: boolean;
};

export type EmbedTurnInput = {
  sessionId: string;
  speaker: string;
  content: string;
};

export type EmbedTranscriptInput = {
  sessionId: string;
  content: string;
};

export type EmbedConsentInput = {
  sessionId: string;
  consented: boolean;
};
