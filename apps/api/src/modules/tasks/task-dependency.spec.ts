import { describe, expect, it } from "vitest";
import { resolveDependencyOrder } from "./task-dependency";

describe("resolveDependencyOrder", () => {
  it("orders tasks respecting dependencies", () => {
    const order = resolveDependencyOrder([
      { id: "a", dependencies: [] },
      { id: "b", dependencies: ["a"] }
    ]);
    expect(order).toEqual(["a", "b"]);
  });

  it("throws on cycles", () => {
    expect(() =>
      resolveDependencyOrder([
        { id: "a", dependencies: ["b"] },
        { id: "b", dependencies: ["a"] }
      ])
    ).toThrow("Dependency cycle detected");
  });
});
