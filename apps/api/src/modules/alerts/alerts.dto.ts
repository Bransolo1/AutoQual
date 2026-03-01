export type CreateAlertInput = {
  workspaceId: string;
  type: string;
  severity: "info" | "warning" | "critical";
  payload: Record<string, unknown>;
};
