import { describe, expect, it } from "vitest";
import { isValidSessionTransition } from "./session-state";

describe("isValidSessionTransition", () => {
  it("allows created -> consented", () => {
    expect(isValidSessionTransition("created", "consented")).toBe(true);
  });

  it("blocks completed -> in_progress", () => {
    expect(isValidSessionTransition("completed", "in_progress")).toBe(false);
  });

  it("allows in_progress -> completed", () => {
    expect(isValidSessionTransition("in_progress", "completed")).toBe(true);
  });
});
