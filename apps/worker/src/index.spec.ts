import { beforeEach, describe, expect, it, vi } from "vitest";
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
      if (String(input).includes("/studies/study-1")) {
        return new Response(JSON.stringify({ workspaceId: "workspace-1" }), { status: 200 });
      }
      if (String(input).includes("/workspaces/demo-workspace-id")) {
        return new Response(JSON.stringify({ retentionDays: 180 }), { status: 200 });
      }
      if (String(input).includes("/transcripts/tx-1") && init?.method !== "PATCH") {
        return new Response(JSON.stringify({ id: "tx-1", content: "email me at test@example.com", sessionId: "session-1" }), {
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

  it("generates insight, approval, and dashboard refresh", async () => {
    const enqueue = vi.fn().mockResolvedValue({ id: "job-1" });
    const result = await handlePipelineJob(
      {
        name: "generate-insight",
        data: { studyId: "study-1", transcriptText: "hello world" },
      },
      { enqueue },
    );
    expect(result).toHaveProperty("statement");
    const fetchCalls = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.map((call) =>
      String(call[0]),
    );
    expect(fetchCalls.some((url) => url.includes("/insights/generate"))).toBe(true);
    expect(fetchCalls.some((url) => url.includes("/approvals"))).toBe(true);
    expect(enqueue).toHaveBeenCalledWith("dashboard.refresh", { workspaceId: "workspace-1", studyId: "study-1" });
  });

  it("runs transcript -> redact -> enqueue insight and theme coding", async () => {
    const enqueue = vi.fn().mockResolvedValue({ id: "job-1" });
    await handlePipelineJob(
      { name: "transcript.redact", data: { transcriptId: "tx-1" } },
      { enqueue },
    );
    expect(enqueue).toHaveBeenCalledWith("generate-insight", expect.any(Object));
    expect(enqueue).toHaveBeenCalledWith("theme.coding", expect.any(Object));
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
