"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deterministicInsightAdapter = deterministicInsightAdapter;
function deterministicInsightAdapter(input) {
    const seed = JSON.stringify(input);
    return {
        statement: "Deterministic insight based on input hash.",
        supporting_transcript_spans: [seed.slice(0, 24)],
        supporting_video_clips: [],
        confidence_score: 0.72,
        business_implication: "Mock adapter used for deterministic tests.",
        tags: ["mock", "deterministic"],
        status: "draft",
        reviewer_comments: []
    };
}
