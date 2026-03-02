import { describe, expect, it } from "vitest";
import { ForbiddenException } from "@nestjs/common";
import { RolesGuard } from "./roles.guard";

const createContext = (user?: { role: string }) =>
  ({
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  }) as any;

describe("RolesGuard", () => {
  it("allows when no roles required", () => {
    const reflector = {
      getAllAndOverride: () => undefined,
    } as any;
    const guard = new RolesGuard(reflector);
    expect(guard.canActivate(createContext({ role: "researcher" }))).toBe(true);
  });

  it("blocks when user missing", () => {
    const reflector = {
      getAllAndOverride: () => ["admin"],
    } as any;
    const guard = new RolesGuard(reflector);
    expect(() => guard.canActivate(createContext())).toThrow(ForbiddenException);
  });

  it("blocks when role does not match", () => {
    const reflector = {
      getAllAndOverride: () => ["admin"],
    } as any;
    const guard = new RolesGuard(reflector);
    expect(() => guard.canActivate(createContext({ role: "researcher" }))).toThrow(ForbiddenException);
  });

  it("allows when role matches", () => {
    const reflector = {
      getAllAndOverride: () => ["admin"],
    } as any;
    const guard = new RolesGuard(reflector);
    expect(guard.canActivate(createContext({ role: "admin" }))).toBe(true);
  });
});
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
