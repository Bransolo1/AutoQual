export type Project = {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  status: "planned" | "active" | "on_hold" | "complete" | "cancelled";
  ownerUserId: string;
  clientOrgName: string;
  startDate: string;
  targetDeliveryDate: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type Milestone = {
  id: string;
  projectId: string;
  name: string;
  dueDate: string;
  status: "not_started" | "in_progress" | "blocked" | "done";
  orderIndex: number;
};

export type Task = {
  id: string;
  projectId: string;
  milestoneId?: string | null;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "blocked" | "done";
  priority: "low" | "medium" | "high" | "critical";
  assigneeUserId?: string | null;
  reviewerUserId?: string | null;
  dueDate: string;
  dependencies: string[];
  createdAt: string;
  updatedAt: string;
};

export type TaskComment = {
  id: string;
  taskId: string;
  authorUserId: string;
  body: string;
  createdAt: string;
};

export type Approval = {
  id: string;
  linkedEntityType: "study" | "report" | "insight_set" | "milestone";
  linkedEntityId: string;
  status: "requested" | "approved" | "rejected";
  requestedByUserId: string;
  decidedByUserId?: string | null;
  decisionNote?: string | null;
  decidedAt?: string | null;
};

export type Insight = {
  id: string;
  studyId: string;
  statement: string;
  supportingTranscriptSpans: string[];
  supportingVideoClips: string[];
  confidenceScore: number;
  businessImplication: string;
  tags: string[];
  status: "draft" | "in_review" | "approved" | "rejected";
  versionNumber: number;
  reviewerComments: string[];
  createdAt: string;
  updatedAt: string;
};
