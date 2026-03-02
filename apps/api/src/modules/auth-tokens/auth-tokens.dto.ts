export type RevokeTokenInput = {
  workspaceId: string;
  actorUserId: string;
  userId?: string;
  jti: string;
  expiresAt: string;
  reason?: string;
};
