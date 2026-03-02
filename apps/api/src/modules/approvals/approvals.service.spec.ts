import { describe, expect, it, vi } from "vitest";
import { ApprovalsService } from "./approvals.service";

describe("ApprovalsService", () => {
  it("blocks creating approved insight_set when evidence is missing", async () => {
    const prisma = {
      approval: { create: vi.fn() },
      insight: {
        findMany: vi.fn().mockResolvedValue([
          { supportingTranscriptSpans: [], supportingVideoClips: [] },
        ]),
      },
      auditEvent: { create: vi.fn() },
      notification: { create: vi.fn() },
    } as any;
    const service = new ApprovalsService(prisma);

    await expect(
      service.create({
        linkedEntityType: "insight_set",
        linkedEntityId: "study-1",
        status: "approved",
        requestedByUserId: "user-1",
        workspaceId: "workspace-1",
        actorUserId: "user-1",
      }),
    ).rejects.toThrow("insight_set_requires_evidence");
    expect(prisma.approval.create).not.toHaveBeenCalled();
  });

  it("blocks approving insight_set when evidence is missing", async () => {
    const prisma = {
      approval: {
        findUnique: vi.fn().mockResolvedValue({
          id: "approval-1",
          status: "requested",
          linkedEntityType: "insight_set",
          linkedEntityId: "study-1",
          requestedByUserId: "user-1",
        }),
        update: vi.fn(),
      },
      insight: {
        findMany: vi.fn().mockResolvedValue([
          { supportingTranscriptSpans: [], supportingVideoClips: [] },
        ]),
      },
      auditEvent: { create: vi.fn() },
      notification: { create: vi.fn() },
    } as any;
    const service = new ApprovalsService(prisma);

    await expect(
      service.updateStatus("approval-1", {
        status: "approved",
        workspaceId: "workspace-1",
        actorUserId: "user-1",
        decidedByUserId: "user-1",
        decisionNote: null,
      }),
    ).rejects.toThrow("insight_set_requires_evidence");
    expect(prisma.approval.update).not.toHaveBeenCalled();
  });

  it("allows approving insight_set when evidence exists", async () => {
    const prisma = {
      approval: {
        findUnique: vi.fn().mockResolvedValue({
          id: "approval-1",
          status: "requested",
          linkedEntityType: "insight_set",
          linkedEntityId: "study-1",
          requestedByUserId: "user-1",
        }),
        update: vi.fn().mockResolvedValue({
          id: "approval-1",
          status: "approved",
          linkedEntityType: "insight_set",
          linkedEntityId: "study-1",
          requestedByUserId: "user-1",
        }),
      },
      insight: {
        findMany: vi.fn().mockResolvedValue([
          { supportingTranscriptSpans: ["span-1"], supportingVideoClips: [] },
        ]),
      },
      auditEvent: { create: vi.fn() },
      notification: { create: vi.fn() },
    } as any;
    const service = new ApprovalsService(prisma);

    const result = await service.updateStatus("approval-1", {
      status: "approved",
      workspaceId: "workspace-1",
      actorUserId: "user-1",
      decidedByUserId: "user-1",
      decisionNote: null,
    });

    expect(result.status).toBe("approved");
    expect(prisma.approval.update).toHaveBeenCalled();
  });
});
