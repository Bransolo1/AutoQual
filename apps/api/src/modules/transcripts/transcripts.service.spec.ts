import { describe, expect, it, vi } from "vitest";
import { TranscriptsService } from "./transcripts.service";

describe("TranscriptsService redaction", () => {
  it("persists redaction metadata", async () => {
    const prisma = {
      transcript: {
        update: vi.fn().mockResolvedValue({ id: "tx-1", piiDetected: true }),
      },
    };
    const queueService = { addTranscriptRedaction: vi.fn() };
    const service = new TranscriptsService(prisma as never, queueService as never);

    const result = await service.redact("tx-1", {
      redactedContent: "[REDACTED_EMAIL]",
      piiDetected: true,
      piiMetadata: { counts: { email: 1 } },
    });

    expect(prisma.transcript.update).toHaveBeenCalledWith({
      where: { id: "tx-1" },
      data: {
        redactedContent: "[REDACTED_EMAIL]",
        piiDetected: true,
        piiMetadata: { counts: { email: 1 } },
      },
    });
    expect(result).toEqual({ id: "tx-1", piiDetected: true });
  });

  it("enqueues redaction on create", async () => {
    const prisma = {
      transcript: {
        create: vi.fn().mockResolvedValue({ id: "tx-2" }),
      },
      session: {
        update: vi.fn().mockResolvedValue({ id: "s1", studyId: "study-1", study: { workspaceId: "workspace-1" } }),
      },
      notification: {
        create: vi.fn(),
      },
      alertEvent: {
        create: vi.fn(),
      },
    };
    const queueService = { addTranscriptRedaction: vi.fn() };
    const service = new TranscriptsService(prisma as never, queueService as never);

    await service.create({ sessionId: "s1", content: "Short response" });

    expect(queueService.addTranscriptRedaction).toHaveBeenCalledWith("tx-2");
    expect(prisma.transcript.create).toHaveBeenCalled();
  });
});
