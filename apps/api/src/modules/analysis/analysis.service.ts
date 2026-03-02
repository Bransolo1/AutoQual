import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AnalysisService {
  constructor(private readonly prisma: PrismaService) {}

  private normalize(text: string) {
    return text.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
  }

  async summary(studyId: string) {
    const [insights, themes, participants, sessions] = await Promise.all([
      this.prisma.insight.findMany({ where: { studyId } }),
      this.prisma.theme.findMany({ where: { studyId } }),
      this.prisma.participant.findMany({ where: { studyId }, include: { sessions: true } }),
      this.prisma.session.findMany({ where: { studyId } }),
    ]);

    const themeClusters = themes.reduce<Record<string, number>>((acc, theme) => {
      acc[theme.label] = (acc[theme.label] ?? 0) + 1;
      return acc;
    }, {});

    const tagCounts = insights.reduce<Record<string, number>>((acc, insight) => {
      insight.tags?.forEach((tag) => {
        acc[tag] = (acc[tag] ?? 0) + 1;
      });
      return acc;
    }, {});

    const segments = participants.reduce<Record<string, { participants: number; sessions: number }>>(
      (acc, participant) => {
        const key = participant.segment || "unassigned";
        acc[key] = acc[key] ?? { participants: 0, sessions: 0 };
        acc[key].participants += 1;
        acc[key].sessions += participant.sessions.length;
        return acc;
      },
      {},
    );

    const statementMap = insights.reduce<Record<string, string[]>>((acc, insight) => {
      const normalized = this.normalize(insight.statement);
      if (!normalized) return acc;
      acc[normalized] = acc[normalized] ?? [];
      acc[normalized].push(insight.id);
      return acc;
    }, {});
    const duplicates = Object.entries(statementMap)
      .filter(([, ids]) => ids.length > 1)
      .map(([statementKey, ids]) => ({ statementKey, ids }));

    const outliers = sessions.filter((session) => {
      if (session.qualityFlag) return true;
      return typeof session.qualityScore === "number" && session.qualityScore < 25;
    });

    const evidenceCoverage = insights.map((insight) => {
      const clips = Array.isArray(insight.supportingVideoClips) ? insight.supportingVideoClips : [];
      const spans = Array.isArray(insight.supportingTranscriptSpans) ? insight.supportingTranscriptSpans : [];
      return {
        insightId: insight.id,
        clipCount: clips.length,
        transcriptSpanCount: spans.length,
      };
    });
    const insightsWithEvidence = evidenceCoverage.filter(
      (item) => item.clipCount > 0 || item.transcriptSpanCount > 0,
    ).length;

    return {
      studyId,
      thematicClusters: themeClusters,
      insightAbstraction: Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tag, count]) => ({ tag, count })),
      segmentComparison: segments,
      duplicateInsights: duplicates,
      evidenceCoverage: {
        insightsWithEvidence,
        totalInsights: insights.length,
        coverageRate: insights.length > 0 ? Math.round((insightsWithEvidence / insights.length) * 100) / 100 : 0,
        clipsPerInsight:
          insights.length > 0
            ? Math.round((evidenceCoverage.reduce((acc, item) => acc + item.clipCount, 0) / insights.length) * 10) / 10
            : 0,
      },
      outlierSessions: outliers.map((session) => ({
        id: session.id,
        qualityScore: session.qualityScore,
        qualityFlag: session.qualityFlag,
      })),
    };
  }

  async evidenceCoverage(studyId: string) {
    const insights = await this.prisma.insight.findMany({
      where: { studyId },
      select: {
        id: true,
        statement: true,
        supportingTranscriptSpans: true,
        supportingVideoClips: true,
        tags: true,
        confidenceScore: true,
      },
    });
    const coverage = insights.map((insight) => {
      const clips = Array.isArray(insight.supportingVideoClips) ? insight.supportingVideoClips : [];
      const spans = Array.isArray(insight.supportingTranscriptSpans) ? insight.supportingTranscriptSpans : [];
      return {
        insightId: insight.id,
        statement: insight.statement,
        tags: insight.tags ?? [],
        confidenceScore: insight.confidenceScore,
        clipCount: clips.length,
        transcriptSpanCount: spans.length,
      };
    });
    const gaps = coverage.filter((item) => item.clipCount === 0 && item.transcriptSpanCount === 0);
    return {
      studyId,
      coverage,
      gaps,
      gapCount: gaps.length,
    };
  }

  async templates(studyId: string) {
    const [insights, themes, participants, clipCount] = await Promise.all([
      this.prisma.insight.findMany({ where: { studyId } }),
      this.prisma.theme.findMany({ where: { studyId } }),
      this.prisma.participant.findMany({ where: { studyId }, select: { segment: true } }),
      this.prisma.clip.count({
        where: { mediaArtifact: { session: { studyId } } },
      }),
    ]);

    const themeCounts = themes.reduce<Record<string, number>>((acc, theme) => {
      acc[theme.label] = (acc[theme.label] ?? 0) + 1;
      return acc;
    }, {});
    const topThemes = Object.entries(themeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, count]) => ({ label, count }));

    const segments = participants.reduce<Record<string, number>>((acc, participant) => {
      const key = participant.segment || "unassigned";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    return {
      studyId,
      templates: [
        {
          id: "themes",
          name: "Thematic summary",
          summary: "Top themes with counts and examples.",
          data: { topThemes, totalThemes: themes.length },
        },
        {
          id: "segments",
          name: "Segment comparison",
          summary: "Participant distribution across target segments.",
          data: { segments, totalParticipants: participants.length },
        },
        {
          id: "evidence",
          name: "Evidence coverage",
          summary: "Evidence traceability coverage for reporting.",
          data: {
            insightCount: insights.length,
            clipCount,
            evidencePerInsight: insights.length > 0 ? Math.round((clipCount / insights.length) * 10) / 10 : 0,
          },
        },
        {
          id: "drivers_barriers",
          name: "Drivers vs barriers",
          summary: "Tag-led drivers and barriers for decision framing.",
          data: {
            drivers: insights.filter((insight) => (insight.tags ?? []).includes("driver")).length,
            barriers: insights.filter((insight) => (insight.tags ?? []).includes("barrier")).length,
          },
        },
      ],
    };
  }
}
