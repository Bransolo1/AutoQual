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
      redactionOffsets: [{ type: "email", start: 0, end: 16 }],
    });

    expect(prisma.transcript.update).toHaveBeenCalledWith({
      where: { id: "tx-1" },
      data: {
        redactedContent: "[REDACTED_EMAIL]",
        piiDetected: true,
        piiMetadata: { counts: { email: 1 } },
        redactionOffsets: [{ type: "email", start: 0, end: 16 }],
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

  it("detects basic PII entities", async () => {
    const prisma = {
      transcript: {
        findUniqueOrThrow: vi.fn().mockResolvedValue({
          content: "Email me at test@example.com or call 555-111-2222.",
        }),
      },
    };
    const queueService = { addTranscriptRedaction: vi.fn() };
    const service = new TranscriptsService(prisma as never, queueService as never);

    const result = await service.detectPii("tx-3", { locale: "en" });

    expect(result.entities.length).toBeGreaterThan(0);
    expect(result.counts.email).toBe(1);
  });

  it("logs audit event on unredact", async () => {
    const prisma = {
      transcript: {
        findUniqueOrThrow: vi.fn().mockResolvedValue({
          id: "tx-4",
          content: "Full content",
          redactedContent: "Redacted",
          piiDetected: true,
          redactionOffsets: [{ type: "email", start: 5, end: 20 }],
          session: { study: { workspaceId: "workspace-1" } },
        }),
      },
      auditEvent: {
        create: vi.fn(),
      },
    };
    const queueService = { addTranscriptRedaction: vi.fn() };
    const service = new TranscriptsService(prisma as never, queueService as never);

    const result = await service.unredact("tx-4", { actorUserId: "reviewer-1", reason: "qa" });

    expect(prisma.auditEvent.create).toHaveBeenCalledWith({
      data: {
        workspaceId: "workspace-1",
        actorUserId: "reviewer-1",
        action: "transcript.unredacted",
        entityType: "transcript",
        entityId: "tx-4",
        metadata: {
          reason: "qa",
          piiDetected: true,
          redactionOffsets: [{ type: "email", start: 5, end: 20 }],
        },
      },
    });
    expect(result.content).toBe("Full content");
  });
});
