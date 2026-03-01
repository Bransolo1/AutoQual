import { describe, expect, it } from "vitest";
import { isAuditMutationAllowed } from "./audit-immutability";

describe("Audit immutability", () => {
  it("blocks updates", () => {
    expect(isAuditMutationAllowed("update")).toBe(false);
  });

  it("blocks deletes", () => {
    expect(isAuditMutationAllowed("delete")).toBe(false);
  });
});
