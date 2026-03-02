export type RevokeTokenInput = {
  workspaceId: string;
  actorUserId: string;
  userId?: string;
  jti: string;
  expiresAt: string;
  reason?: string;
};

export type RevokedTokenStatusFilter = "active" | "expired" | "all";

export type ListRevokedTokensQuery = {
  workspaceId: string;
  userId?: string;
  q?: string;
  status?: RevokedTokenStatusFilter;
  limit?: number;
  cursor?: string;
};

export type RevokedTokenItem = {
  id: string;
  jti: string;
  userId: string | null;
  revokedByUserId: string;
  revokedReason: string | null;
  expiresAt: string;
  createdAt: string;
};

export type RevokedTokenListResponse = {
  items: RevokedTokenItem[];
  nextCursor: string | null;
};
