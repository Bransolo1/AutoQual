export type CreateReviewInput = {
  insightId: string;
  status: "draft" | "in_review" | "approved" | "rejected";
  reviewerId?: string | null;
  comments?: string | null;
};

export type UpdateReviewStatusInput = {
  status: "draft" | "in_review" | "approved" | "rejected";
  reviewerId?: string | null;
  decisionNote?: string | null;
  workspaceId: string;
  actorUserId: string;
};

export type AddReviewCommentInput = {
  authorUserId: string;
  body: string;
};

export type AssignReviewerInput = {
  reviewerId: string;
  workspaceId: string;
  actorUserId: string;
};
