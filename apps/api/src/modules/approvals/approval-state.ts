export function canTransitionApproval(from: string, to: string) {
  if (from === "requested" && (to === "approved" || to === "rejected")) {
    return true;
  }
  return false;
}
