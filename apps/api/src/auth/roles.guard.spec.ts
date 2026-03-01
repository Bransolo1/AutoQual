import { describe, expect, it } from "vitest";
import { RolesGuard } from "./roles.guard";

const makeContext = (request: Record<string, unknown>) =>
  ({
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  }) as unknown;

describe("RolesGuard", () => {
  it("allows required role", () => {
    const guard = new RolesGuard({
      getAllAndOverride: () => ["admin"],
    } as never);
    const context = makeContext({
      user: { role: "admin" },
    });
    expect(guard.canActivate(context as never)).toBe(true);
  });

  it("blocks missing role", () => {
    const guard = new RolesGuard({
      getAllAndOverride: () => ["admin"],
    } as never);
    const context = makeContext({
      user: { role: "researcher" },
    });
    expect(() => guard.canActivate(context as never)).toThrow("Requires one of: admin");
  });
});
