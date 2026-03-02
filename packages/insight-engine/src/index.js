"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildInsight = buildInsight;
function buildInsight(input) {
    return {
        id: `insight_${Date.now()}`,
        statement: input.statement,
        supporting_transcript_spans: input.supportingTranscriptSpans,
        supporting_video_clips: input.supportingVideoClips,
        confidence_score: input.confidenceScore,
        business_implication: input.businessImplication,
        tags: input.tags,
        linked_study: input.linkedStudy,
        status: "draft",
        version_number: 1,
        reviewer_comments: []
    };
}
