import { describe, expect, it } from "vitest";
import { ProjectsService } from "./projects.service";

describe("ProjectsService.getClientView", () => {
  it("includes only approved insights unless insight_set approval exists", async () => {
    const prisma = {
      project: {
        findUniqueOrThrow: async () => ({
          id: "project-1",
          name: "Project One",
          clientOrgName: "Client",
          studies: [
            {
              id: "study-1",
              language: "en",
              insights: [
                { id: "insight-1", statement: "Approved insight", status: "approved" },
                { id: "insight-2", statement: "Draft insight", status: "draft" },
              ],
            },
            {
              id: "study-2",
              language: "en",
              insights: [{ id: "insight-3", statement: "Draft insight 2", status: "draft" }],
            },
          ],
          milestones: [],
        }),
      },
      mediaArtifact: { findMany: async () => [] },
      transcript: { findMany: async () => [] },
      approval: {
        findMany: async () => [
          { linkedEntityType: "insight_set", linkedEntityId: "study-2", status: "approved" },
        ],
      },
      activationMetric: { findMany: async () => [] },
    } as any;
    const service = new ProjectsService(prisma);

    const result = await service.getClientView("project-1");
    const statements = result.insightHeadlines.map((item: { statement: string }) => item.statement);

    expect(statements).toContain("Approved insight");
    expect(statements).not.toContain("Draft insight");
    expect(statements).toContain("Draft insight 2");
  });
});
