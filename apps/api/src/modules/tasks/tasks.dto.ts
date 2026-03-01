export type CreateTaskInput = {
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
  workspaceId?: string;
  actorUserId?: string;
};

export type UpdateTaskStatusInput = {
  status: "todo" | "in_progress" | "blocked" | "done";
  workspaceId: string;
  actorUserId: string;
  blockedReason?: string | null;
  blockedByTaskId?: string | null;
};

export type UpdateTaskInput = {
  title?: string;
  description?: string;
  priority?: "low" | "medium" | "high" | "critical";
  assigneeUserId?: string | null;
  reviewerUserId?: string | null;
  dueDate?: string;
  dependencies?: string[];
  workspaceId?: string;
  actorUserId?: string;
};

export type ShareTaskInput = {
  workspaceId: string;
  actorUserId: string;
  channel?: "link" | "qr" | "copy_id";
  context?: string;
};
