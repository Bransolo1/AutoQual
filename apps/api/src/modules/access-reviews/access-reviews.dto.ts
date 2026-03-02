export type CreateAccessReviewInput = {
  workspaceId: string;
  reviewerUserId: string;
  notes?: string;
  reviewedUserIds?: string[];
};
