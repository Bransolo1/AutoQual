const { describe, it, expect } = require("vitest");
const { deterministicInsightAdapter } = require("./mock");

describe("deterministicInsightAdapter", () => {
  it("returns the same output for identical input", () => {
    const input = { studyId: "study-1", transcriptText: "hello world" };
    const first = deterministicInsightAdapter(input);
    const second = deterministicInsightAdapter(input);
    expect(second).toEqual(first);
  });

  it("changes transcript span when input changes", () => {
    const first = deterministicInsightAdapter({ studyId: "study-1", transcriptText: "hello world" });
    const second = deterministicInsightAdapter({ studyId: "study-1", transcriptText: "hello world!!" });
    expect(second.supporting_transcript_spans[0]).not.toEqual(first.supporting_transcript_spans[0]);
  });
});
