export type Role = "admin" | "researcher" | "reviewer" | "client";

export function canAccessProject(role: Role) {
  return role !== "client";
}

export function canAccessClientPortal(role: Role) {
  return role === "client" || role === "admin";
}
