export type CreateAlertInput = {
  workspaceId: string;
  type: string;
  severity: "info" | "warning" | "critical";
  payload: Record<string, unknown>;
};

export type CreateAlertViewInput = {
  workspaceId: string;
  name: string;
  createdByUserId: string;
  filters: Record<string, unknown>;
};
