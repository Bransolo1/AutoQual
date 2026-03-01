import { describe, expect, it } from "vitest";

function canAccessClientPortal(role: string) {
  return role === "client" || role === "admin";
}

describe("Client portal access", () => {
  it("allows client role", () => {
    expect(canAccessClientPortal("client")).toBe(true);
  });

  it("blocks reviewer role", () => {
    expect(canAccessClientPortal("reviewer")).toBe(false);
  });
});
