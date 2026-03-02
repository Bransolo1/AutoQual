export type CreateTranscriptInput = {
  sessionId: string;
  content: string;
  wordTimestamps?: Array<{ word: string; startMs: number; endMs: number }>;
  diarization?: Array<{ speaker: string; startMs: number; endMs: number; confidence?: number }>;
};

export type RedactTranscriptInput = {
  redactedContent: string;
  piiDetected: boolean;
  piiMetadata?: Record<string, unknown> | null;
  redactionOffsets?: Array<{ type: string; start: number; end: number }> | null;
};

export type DetectPiiInput = {
  locale?: string;
};

export type CreateTranscriptSpanInput = {
  startMs: number;
  endMs: number;
};

export type UnredactTranscriptInput = {
  actorUserId?: string;
  reason?: string;
};

export type PiiEntity = {
  type: "email" | "phone" | "ssn" | "credit_card";
  start: number;
  end: number;
  value: string;
};
