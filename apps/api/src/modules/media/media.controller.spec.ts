import "reflect-metadata";
import { describe, expect, it } from "vitest";
import { IS_PUBLIC_KEY } from "../../auth/public.decorator";
import { ROLES_KEY } from "../../auth/roles.decorator";
import { MediaController } from "./media.controller";

describe("MediaController authorization", () => {
  it("protects processArtifact with admin/system roles", () => {
    const controller = new MediaController({} as any);
    const handler = controller.processArtifact;

    const isPublic = Reflect.getMetadata(IS_PUBLIC_KEY, handler);
    const roles = Reflect.getMetadata(ROLES_KEY, handler);

    expect(isPublic).toBeUndefined();
    expect(roles).toEqual(["admin", "system"]);
  });
});
