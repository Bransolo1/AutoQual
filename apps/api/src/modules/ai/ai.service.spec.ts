import { describe, expect, it } from "vitest";
import { AiService } from "./ai.service";

describe("AiService deterministic mock", () => {
  it("returns deterministic output for same input", async () => {
    const service = new AiService();
    const input = { studyId: "study-1", transcriptText: "hello world" };
    const first = await service.generateInsight(input);
    const second = await service.generateInsight(input);
    expect(first.statement).toBe(second.statement);
    expect(first.supporting_transcript_spans).toEqual(second.supporting_transcript_spans);
  });
});
