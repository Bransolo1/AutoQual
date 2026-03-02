import { describe, expect, it } from "vitest";
import { ForbiddenException } from "@nestjs/common";
import { WorkspaceGuard } from "./workspace.guard";

const createContext = (request: { method: string; url: string; headers?: Record<string, string> }, user?: any) =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({ ...request, headers: request.headers ?? {}, user }),
    }),
  }) as any;

describe("WorkspaceGuard", () => {
  it("allows client role to read client routes", () => {
    const guard = new WorkspaceGuard();
    const ctx = createContext({ method: "GET", url: "/projects/123/client-view" }, { role: "client", workspaceId: "w1" });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it("blocks client role from mutating routes", () => {
    const guard = new WorkspaceGuard();
    const ctx = createContext({ method: "POST", url: "/projects" }, { role: "client", workspaceId: "w1" });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it("allows client role to PATCH approvals", () => {
    const guard = new WorkspaceGuard();
    const ctx = createContext({ method: "PATCH", url: "/approvals/123" }, { role: "client", workspaceId: "w1" });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it("blocks when workspace header mismatches user", () => {
    const guard = new WorkspaceGuard();
    const ctx = createContext(
      { method: "GET", url: "/projects", headers: { "x-workspace-id": "w2" } },
      { role: "researcher", workspaceId: "w1" },
    );
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
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
