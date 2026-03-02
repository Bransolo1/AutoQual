import { describe, expect, it, vi } from "vitest";
import { InsightsService } from "./insights.service";

describe("InsightsService versioning", () => {
  it("increments version and creates version record", async () => {
    const tx = {
      insight: {
        findUniqueOrThrow: vi.fn().mockResolvedValue({ id: "insight-1", versionNumber: 1, status: "draft" }),
        update: vi.fn(),
      },
      insightVersion: {
        create: vi.fn(),
      },
    };
    const prisma = {
      $transaction: (cb: (trx: typeof tx) => unknown) => cb(tx),
    } as any;
    const service = new InsightsService(prisma, {} as any);

    await service.addVersion("insight-1", {
      statement: "Updated",
      supportingTranscriptSpans: [],
      supportingVideoClips: [],
      confidenceScore: 0.5,
      businessImplication: "Test",
      tags: ["test"],
      reviewerComments: [],
    });

    expect(tx.insight.update).toHaveBeenCalledWith({
      where: { id: "insight-1" },
      data: expect.objectContaining({ versionNumber: 2, statement: "Updated" }),
    });
    expect(tx.insightVersion.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ insightId: "insight-1", versionNumber: 2 }),
    });
  });

  it("blocks approved insight creation without evidence", async () => {
    const tx = {
      insight: { create: vi.fn() },
      insightVersion: { create: vi.fn() },
    };
    const prisma = {
      $transaction: (cb: (trx: typeof tx) => unknown) => cb(tx),
    } as any;
    const service = new InsightsService(prisma, {} as any);

    await expect(
      service.create({
        studyId: "study-1",
        statement: "Approved without evidence",
        supportingTranscriptSpans: [],
        supportingVideoClips: [],
        confidenceScore: 0.8,
        businessImplication: "test",
        tags: ["driver"],
        status: "approved",
        reviewerComments: [],
      }),
    ).rejects.toThrow("Approved insights require evidence.");
    expect(tx.insight.create).not.toHaveBeenCalled();
  });

  it("allows approved insight creation when evidence exists", async () => {
    const tx = {
      insight: { create: vi.fn().mockResolvedValue({ id: "insight-1" }) },
      insightVersion: { create: vi.fn() },
    };
    const prisma = {
      $transaction: (cb: (trx: typeof tx) => unknown) => cb(tx),
    } as any;
    const service = new InsightsService(prisma, {} as any);

    const result = await service.create({
      studyId: "study-1",
      statement: "Approved with evidence",
      supportingTranscriptSpans: ["span-1"],
      supportingVideoClips: [],
      confidenceScore: 0.8,
      businessImplication: "test",
      tags: ["driver"],
      status: "approved",
      reviewerComments: [],
    });

    expect(result).toEqual({ id: "insight-1" });
    expect(tx.insight.create).toHaveBeenCalled();
    expect(tx.insightVersion.create).toHaveBeenCalled();
  });

  it("blocks approved insight version without evidence", async () => {
    const tx = {
      insight: {
        findUniqueOrThrow: vi.fn().mockResolvedValue({ id: "insight-1", versionNumber: 1, status: "approved" }),
        update: vi.fn(),
      },
      insightVersion: {
        create: vi.fn(),
      },
    };
    const prisma = {
      $transaction: (cb: (trx: typeof tx) => unknown) => cb(tx),
    } as any;
    const service = new InsightsService(prisma, {} as any);

    await expect(
      service.addVersion("insight-1", {
        statement: "Updated",
        supportingTranscriptSpans: [],
        supportingVideoClips: [],
        confidenceScore: 0.5,
        businessImplication: "Test",
        tags: ["test"],
        reviewerComments: [],
      }),
    ).rejects.toThrow("Approved insights require evidence.");
    expect(tx.insight.update).not.toHaveBeenCalled();
  });
});
