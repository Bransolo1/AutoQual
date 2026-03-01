export type CreateTrustArtifactInput = {
  workspaceId: string;
  category: string;
  status: "draft" | "in_review" | "approved" | "expired";
  filename: string;
  storageKey: string;
  notes?: string;
};

export type UpdateTrustArtifactInput = {
  status?: "draft" | "in_review" | "approved" | "expired";
  notes?: string;
};
