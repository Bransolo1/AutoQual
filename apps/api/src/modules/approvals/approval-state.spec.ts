import { describe, expect, it } from "vitest";
import { canTransitionApproval } from "./approval-state";

describe("canTransitionApproval", () => {
  it("allows requested -> approved", () => {
    expect(canTransitionApproval("requested", "approved")).toBe(true);
  });

  it("blocks invalid transitions", () => {
    expect(canTransitionApproval("approved", "requested")).toBe(false);
  });
});
