import { describe, expect, it } from "vitest";
import { resolveDependencyOrder } from "./task-dependency";

describe("resolveDependencyOrder", () => {
  it("orders tasks so dependencies come first", () => {
    const order = resolveDependencyOrder([
      { id: "task-a", dependencies: ["task-b", "task-c"] },
      { id: "task-b", dependencies: [] },
      { id: "task-c", dependencies: ["task-b"] },
    ]);
    expect(order.indexOf("task-b")).toBeLessThan(order.indexOf("task-c"));
    expect(order.indexOf("task-c")).toBeLessThan(order.indexOf("task-a"));
  });

  it("throws when dependency cycle exists", () => {
    expect(() =>
      resolveDependencyOrder([
        { id: "task-a", dependencies: ["task-b"] },
        { id: "task-b", dependencies: ["task-a"] },
      ]),
    ).toThrow("Dependency cycle detected");
  });
});
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
