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
};

export type DetectPiiInput = {
  locale?: string;
};

export type PiiEntity = {
  type: "email" | "phone" | "ssn" | "credit_card";
  start: number;
  end: number;
  value: string;
};
