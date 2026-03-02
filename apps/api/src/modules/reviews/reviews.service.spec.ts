import { describe, expect, it, vi } from "vitest";
import { ReviewsService } from "./reviews.service";

describe("ReviewsService", () => {
  it("blocks creating approved review without evidence", async () => {
    const prisma = {
      insight: {
        findUniqueOrThrow: vi.fn().mockResolvedValue({
          supportingTranscriptSpans: [],
          supportingVideoClips: [],
        }),
      },
      review: {
        create: vi.fn(),
      },
    } as any;
    const service = new ReviewsService(prisma);

    await expect(
      service.create({
        insightId: "insight-1",
        status: "approved",
        reviewerId: "reviewer-1",
        comments: null,
      }),
    ).rejects.toThrow("Approved reviews require evidence-backed insights.");
    expect(prisma.review.create).not.toHaveBeenCalled();
  });

  it("blocks approving review without evidence", async () => {
    const prisma = {
      review: {
        findUniqueOrThrow: vi.fn().mockResolvedValue({
          insight: { supportingTranscriptSpans: [], supportingVideoClips: [] },
        }),
        update: vi.fn(),
      },
      auditEvent: {
        create: vi.fn(),
      },
    } as any;
    const service = new ReviewsService(prisma);

    await expect(
      service.updateStatus("review-1", {
        status: "approved",
        workspaceId: "workspace-1",
        actorUserId: "user-1",
        decisionNote: null,
      }),
    ).rejects.toThrow("Approved reviews require evidence-backed insights.");
    expect(prisma.review.update).not.toHaveBeenCalled();
  });
});
