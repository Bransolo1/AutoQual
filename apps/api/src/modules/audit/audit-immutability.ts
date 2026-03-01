export type AuditMutationAction = "update" | "delete" | "deleteMany" | "updateMany" | "upsert";

export function isAuditMutationAllowed(action: AuditMutationAction) {
  const retentionAllowed = process.env.AUDIT_RETENTION_ALLOW === "true";
  if (retentionAllowed && action === "deleteMany") {
    return true;
  }
  return false;
}

