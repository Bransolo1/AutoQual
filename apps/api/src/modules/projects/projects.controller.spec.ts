import { describe, expect, it } from "vitest";
import { ROLES_KEY } from "../../auth/roles.decorator";
import { ProjectsController } from "./projects.controller";

describe("ProjectsController RBAC", () => {
  it("sets roles metadata on sensitive endpoints", () => {
    const controller = new ProjectsController({} as any);
    const createRoles = Reflect.getMetadata(ROLES_KEY, controller.create);
    const listRoles = Reflect.getMetadata(ROLES_KEY, controller.list);
    const clientViewRoles = Reflect.getMetadata(ROLES_KEY, controller.getClientView);
    const analysisRoles = Reflect.getMetadata(ROLES_KEY, controller.getAnalysisDelivery);

    expect(createRoles).toEqual(["admin", "researcher"]);
    expect(listRoles).toEqual(["admin", "researcher", "reviewer"]);
    expect(clientViewRoles).toEqual(["admin", "researcher", "reviewer", "client"]);
    expect(analysisRoles).toEqual(["admin", "researcher", "reviewer", "client"]);
  });
});
