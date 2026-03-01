import { describe, expect, it, vi } from "vitest";
import { SessionsService } from "./sessions.service";

describe("SessionsService pipeline", () => {
  it("enqueues transcription on completion", async () => {
    const prisma = {
      session: {
        findUnique: vi.fn().mockResolvedValue({ id: "s1", status: "in_progress" }),
        update: vi.fn().mockResolvedValue({
          id: "s1",
          status: "completed",
          study: { workspaceId: "w1", projectId: "p1" },
          studyId: "study-1",
          participantId: "participant-1",
        }),
        findUniqueOrThrow: vi.fn().mockResolvedValue({
          id: "s1",
          studyId: "study-1",
          participantId: "participant-1",
          study: { workspaceId: "w1", projectId: "p1" },
        }),
      },
      task: {
        findFirst: vi.fn().mockResolvedValue(null),
        update: vi.fn(),
      },
      approval: {
        create: vi.fn().mockResolvedValue({ id: "approval-1" }),
      },
      auditEvent: {
        create: vi.fn(),
      },
      notification: {
        create: vi.fn(),
      },
    };
    const queueService = {
      addTranscriptionJob: vi.fn(),
    };

    const service = new SessionsService(prisma as never, queueService as never);
    await service.updateStatus("s1", "completed");

    expect(queueService.addTranscriptionJob).toHaveBeenCalledWith("s1");
    expect(prisma.approval.create).toHaveBeenCalled();
    expect(prisma.notification.create).toHaveBeenCalled();
  });
});
