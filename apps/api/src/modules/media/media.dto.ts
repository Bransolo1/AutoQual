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

export type InitChunkUploadInput = {
  sessionId: string;
  fileName: string;
  contentType?: string;
};

export type ChunkPartUrlInput = {
  storageKey: string;
  uploadId: string;
  partNumber: number;
};

export type CompleteChunkUploadInput = {
  storageKey: string;
  uploadId: string;
  parts: { ETag: string; PartNumber: number }[];
  sessionId: string;
  type?: string;
};
