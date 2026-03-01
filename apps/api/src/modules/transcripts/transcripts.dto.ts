export type CreateTranscriptInput = {
  sessionId: string;
  content: string;
};

export type RedactTranscriptInput = {
  redactedContent: string;
  piiDetected: boolean;
  piiMetadata?: Record<string, unknown> | null;
};
