import { describe, expect, it, vi, beforeEach } from "vitest";
import { handlePipelineJob, redactPII } from "./index";

describe("worker pipeline", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).includes("/insights/generate")) {
        return new Response(JSON.stringify({ id: "insight-1" }), { status: 200 });
      }
      if (String(input).includes("/approvals")) {
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }
      if (String(input).includes("/search/index/insight")) {
        return new Response(JSON.stringify({ indexed: true }), { status: 200 });
      }
      if (String(input).includes("/sessions/session-1")) {
        return new Response(JSON.stringify({ studyId: "study-1" }), { status: 200 });
      }
      if (String(input).includes("/workspaces/demo-workspace-id")) {
        return new Response(JSON.stringify({ retentionDays: 180 }), { status: 200 });
      }
      if (String(input).includes("/transcripts/tx-1") && init?.method !== "PATCH") {
        return new Response(JSON.stringify({ id: "tx-1", content: "email me at test@example.com" }), {
          status: 200,
        });
      }
      if (String(input).includes("/transcripts")) {
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }
      if (String(input).includes("/themes")) {
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }
      if (String(input).includes("/media/retention/archive")) {
        return new Response(JSON.stringify({ archived: 2 }), { status: 200 });
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }));
  });

  it("generates insight and approval on pipeline job", async () => {
    const result = await handlePipelineJob({
      name: "generate-insight",
      data: { studyId: "study-1", transcriptText: "hello world" },
    });
    expect(result).toHaveProperty("statement");
    const fetchCalls = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.map((call) =>
      String(call[0]),
    );
    expect(fetchCalls.some((url) => url.includes("/insights/generate"))).toBe(true);
    expect(fetchCalls.some((url) => url.includes("/approvals"))).toBe(true);
  });

  it("creates a transcript on transcription job", async () => {
    await handlePipelineJob({
      name: "transcription.generate",
      data: { sessionId: "session-1" },
    });
    const fetchCalls = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.map((call) =>
      String(call[0]),
    );
    expect(fetchCalls.some((url) => url.includes("/transcripts"))).toBe(true);
  });

  it("runs full session pipeline chain", async () => {
    const enqueue = vi.fn().mockResolvedValue({ id: "job-1" });
    await handlePipelineJob({
      name: "transcription.generate",
      data: { sessionId: "session-1" },
    });
    await handlePipelineJob({
      name: "transcript.redact",
      data: { transcriptId: "tx-1" },
    }, { enqueue });
    await handlePipelineJob({
      name: "generate-insight",
      data: { studyId: "study-1", transcriptText: "redacted transcript" },
    });
    const fetchCalls = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.map((call) =>
      String(call[0]),
    );
    expect(fetchCalls.some((url) => url.includes("/transcripts"))).toBe(true);
    expect(fetchCalls.some((url) => url.includes("/transcripts/tx-1"))).toBe(true);
    expect(fetchCalls.some((url) => url.includes("/insights/generate"))).toBe(true);
    expect(fetchCalls.some((url) => url.includes("/approvals"))).toBe(true);
    expect(fetchCalls.some((url) => url.includes("/search/index/insight"))).toBe(true);
    expect(enqueue).toHaveBeenCalledWith("generate-insight", expect.any(Object));
    expect(enqueue).toHaveBeenCalledWith("theme.coding", expect.any(Object));
  });

  it("redacts common PII patterns", () => {
    const result = redactPII("Contact me at test@example.com or +1 415-555-1234 https://site.test");
    expect(result.redacted).toContain("[REDACTED_EMAIL]");
    expect(result.redacted).toContain("[REDACTED_PHONE]");
    expect(result.redacted).toContain("[REDACTED_URL]");
    expect(result.piiDetected).toBe(true);
  });

  it("archives stale media using retention settings", async () => {
    await handlePipelineJob({
      name: "retention.archive",
      data: { workspaceId: "demo-workspace-id" },
    });
    const fetchCalls = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.map((call) =>
      String(call[0]),
    );
    expect(fetchCalls.some((url) => url.includes("/workspaces/demo-workspace-id"))).toBe(true);
    expect(fetchCalls.some((url) => url.includes("/media/retention/archive"))).toBe(true);
  });
});
