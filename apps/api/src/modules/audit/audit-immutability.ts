export type AuditMutationAction = "update" | "delete" | "deleteMany" | "updateMany" | "upsert";

export function isAuditMutationAllowed(action: AuditMutationAction) {
  return false;
}

