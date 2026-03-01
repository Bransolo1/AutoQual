export type CreateApprovalInput = {
  linkedEntityType: "study" | "report" | "insight_set" | "milestone";
  linkedEntityId: string;
  status: "requested" | "approved" | "rejected";
  requestedByUserId: string;
  decidedByUserId?: string | null;
  decisionNote?: string | null;
  decidedAt?: string | null;
  workspaceId?: string;
  actorUserId?: string;
};

export type UpdateApprovalStatusInput = {
  status: "approved" | "rejected";
  decidedByUserId: string;
  decisionNote?: string | null;
  workspaceId: string;
  actorUserId: string;
};
