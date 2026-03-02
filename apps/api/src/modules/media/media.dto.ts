export type CreateMediaArtifactInput = {
  sessionId: string;
  type: string;
  storageKey: string;
};

export type CreateClipInput = {
  mediaArtifactId: string;
  startMs: number;
  endMs: number;
};

export type UpdateMediaLegalHoldInput = {
  enabled: boolean;
};
