import { describe, expect, it, vi } from "vitest";
import { ProjectsService } from "./projects.service";

describe("ProjectsService workspace isolation", () => {
  it("filters by workspaceId when listing projects", async () => {
    const prisma = {
      project: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    } as any;
    const service = new ProjectsService(prisma);

    await service.list({ workspaceId: "workspace-1" });

    expect(prisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ workspaceId: "workspace-1" }),
      }),
    );
  });
});
