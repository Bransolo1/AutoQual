import { describe, expect, it } from "vitest";
import { WorkspaceGuard } from "./workspace.guard";

const makeContext = (request: Record<string, unknown>) =>
  ({
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  }) as unknown;

describe("WorkspaceGuard", () => {
  it("blocks client write access", () => {
    const guard = new WorkspaceGuard();
    const context = makeContext({
      method: "POST",
      url: "/projects",
      headers: {},
      user: { role: "client", workspaceId: "w1" },
    });
    expect(() => guard.canActivate(context as never)).toThrow("Client role has restricted access");
  });

  it("allows client read access", () => {
    const guard = new WorkspaceGuard();
    const context = makeContext({
      method: "GET",
      url: "/projects",
      headers: {},
      user: { role: "client", workspaceId: "w1" },
    });
    expect(guard.canActivate(context as never)).toBe(true);
  });

  it("blocks workspace mismatch", () => {
    const guard = new WorkspaceGuard();
    const context = makeContext({
      method: "GET",
      url: "/projects",
      headers: { "x-workspace-id": "w2" },
      user: { role: "researcher", workspaceId: "w1" },
    });
    expect(() => guard.canActivate(context as never)).toThrow("Workspace mismatch");
  });
});
