import { describe, expect, it } from "vitest";

function canAccessProject(role: string) {
  return role !== "client";
}

describe("RBAC project access", () => {
  it("blocks client role", () => {
    expect(canAccessProject("client")).toBe(false);
  });

  it("allows researcher role", () => {
    expect(canAccessProject("researcher")).toBe(true);
  });
});
