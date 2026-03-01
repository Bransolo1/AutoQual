export function isValidSessionTransition(current: string, next: string) {
  if (current === next) return true;
  const allowed: Record<string, string[]> = {
    created: ["consented", "in_progress", "cancelled"],
    consented: ["in_progress", "cancelled"],
    in_progress: ["completed", "cancelled", "screened_out"],
    screened_out: [],
    completed: [],
    cancelled: [],
  };
  return (allowed[current] ?? []).includes(next);
}

