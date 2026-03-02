import { describe, expect, it } from "vitest";
import { isValidApprovalTransition } from "./approval-state";

describe("isValidApprovalTransition", () => {
  it("allows requested -> approved", () => {
    expect(isValidApprovalTransition("requested", "approved")).toBe(true);
  });

  it("allows requested -> rejected", () => {
    expect(isValidApprovalTransition("requested", "rejected")).toBe(true);
  });

  it("blocks approved -> rejected", () => {
    expect(isValidApprovalTransition("approved", "rejected")).toBe(false);
  });

  it("blocks rejected -> approved", () => {
    expect(isValidApprovalTransition("rejected", "approved")).toBe(false);
  });
});
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
