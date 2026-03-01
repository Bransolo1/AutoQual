export type CreateMilestoneInput = {
  projectId: string;
  name: string;
  dueDate: string;
  status: "not_started" | "in_progress" | "blocked" | "done";
  orderIndex: number;
};
