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
