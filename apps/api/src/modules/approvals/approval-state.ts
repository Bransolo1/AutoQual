export type ApprovalStatus = "requested" | "approved" | "rejected";

export function isValidApprovalTransition(current: ApprovalStatus, next: ApprovalStatus) {
  if (current === "requested" && (next === "approved" || next === "rejected")) {
    return true;
  }
  return false;
}
export function canTransitionApproval(from: string, to: string) {
  if (from === "requested" && (to === "approved" || to === "rejected")) {
    return true;
  }
  return false;
}
