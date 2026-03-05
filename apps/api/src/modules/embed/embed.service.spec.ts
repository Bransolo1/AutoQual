import { describe, expect, it, vi } from "vitest";
import { EmbedService } from "./embed.service";

describe("EmbedService.notifyCompletion", () => {
  it("updates session status and enqueues transcription when sessionId is provided", async () => {
    const prisma = {
      session: {
        update: vi.fn().mockResolvedValue({ id: "s1", status: "completed" }),
      },
      study: {
        findUnique: vi.fn().mockResolvedValue({ workspaceId: "w1", projectId: "p1" }),
      },
      notification: { create: vi.fn() },
      auditEvent: { create: vi.fn() },
    };
    const queueService = {
      addTranscriptionJob: vi.fn(),
    };

    const service = new EmbedService(prisma as never, queueService as never);
    await service.notifyCompletion("study-1", { sessionId: "s1", metadata: {} });

    expect(prisma.session.update).toHaveBeenCalledWith({
      where: { id: "s1" },
      data: { status: "completed" },
    });
    expect(queueService.addTranscriptionJob).toHaveBeenCalledWith("s1");
  });

  it("skips session update when sessionId is not provided", async () => {
    const prisma = {
      session: { update: vi.fn() },
      study: {
        findUnique: vi.fn().mockResolvedValue({ workspaceId: "w1", projectId: "p1" }),
      },
      notification: { create: vi.fn() },
      auditEvent: { create: vi.fn() },
    };
    const queueService = {
      addTranscriptionJob: vi.fn(),
    };

    const service = new EmbedService(prisma as never, queueService as never);
    await service.notifyCompletion("study-1", { metadata: {} });

    expect(prisma.session.update).not.toHaveBeenCalled();
    expect(queueService.addTranscriptionJob).not.toHaveBeenCalled();
  });
});
