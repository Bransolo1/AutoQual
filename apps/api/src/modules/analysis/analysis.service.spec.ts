import { describe, expect, it } from "vitest";
import { AnalysisService } from "./analysis.service";

describe("AnalysisService", () => {
  it("builds summary with evidence coverage and outliers", async () => {
    const prisma = {
      insight: {
        findMany: async () => [
          {
            id: "insight-1",
            statement: "Pricing is confusing",
            tags: ["driver"],
            supportingVideoClips: [{ id: "clip-1" }],
            supportingTranscriptSpans: [],
          },
          {
            id: "insight-2",
            statement: "Pricing is confusing",
            tags: ["barrier"],
            supportingVideoClips: [],
            supportingTranscriptSpans: [],
          },
        ],
      },
      theme: {
        findMany: async () => [{ label: "price" }, { label: "price" }, { label: "ux" }],
      },
      participant: {
        findMany: async () => [
          { segment: "enterprise", sessions: [{ id: "s1" }] },
          { segment: "smb", sessions: [{ id: "s2" }, { id: "s3" }] },
        ],
      },
      session: {
        findMany: async () => [
          { id: "s1", qualityScore: 90, qualityFlag: null },
          { id: "s2", qualityScore: 10, qualityFlag: null },
          { id: "s3", qualityScore: 60, qualityFlag: "uncooperative" },
        ],
      },
    } as never;
    const service = new AnalysisService(prisma);

    const result = await service.summary("study-1");

    expect(result.evidenceCoverage).toEqual({
      insightsWithEvidence: 1,
      totalInsights: 2,
      coverageRate: 0.5,
      clipsPerInsight: 0.5,
    });
    expect(result.duplicateInsights).toHaveLength(1);
    expect(result.outlierSessions).toHaveLength(2);
    expect(result.segmentComparison.enterprise.participants).toBe(1);
  });

  it("returns evidence coverage gaps", async () => {
    const prisma = {
      insight: {
        findMany: async () => [
          {
            id: "insight-1",
            statement: "All good",
            supportingTranscriptSpans: [{ id: "span-1" }],
            supportingVideoClips: [],
            tags: ["driver"],
            confidenceScore: 0.6,
          },
          {
            id: "insight-2",
            statement: "Missing evidence",
            supportingTranscriptSpans: [],
            supportingVideoClips: [],
            tags: [],
            confidenceScore: 0.3,
          },
        ],
      },
    } as never;
    const service = new AnalysisService(prisma);

    const result = await service.evidenceCoverage("study-1");

    expect(result.gapCount).toBe(1);
    expect(result.gaps[0].insightId).toBe("insight-2");
  });

  it("builds analysis templates with live counts", async () => {
    const prisma = {
      insight: {
        findMany: async () => [
          { id: "insight-1", tags: ["driver"] },
          { id: "insight-2", tags: ["barrier"] },
          { id: "insight-3", tags: [] },
        ],
      },
      theme: {
        findMany: async () => [{ label: "speed" }, { label: "speed" }, { label: "trust" }],
      },
      participant: {
        findMany: async () => [{ segment: "enterprise" }, { segment: "enterprise" }, { segment: "smb" }],
      },
      clip: {
        count: async () => 6,
      },
    } as never;
    const service = new AnalysisService(prisma);

    const result = await service.templates("study-1");
    const evidenceTemplate = result.templates.find((template) => template.id === "evidence");
    const driversTemplate = result.templates.find((template) => template.id === "drivers_barriers");

    expect(evidenceTemplate?.data).toEqual({ insightCount: 3, clipCount: 6, evidencePerInsight: 2 });
    expect(driversTemplate?.data).toEqual({ drivers: 1, barriers: 1 });
  });
});
