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

    return {
      studyId,
      thematicClusters: themeClusters,
      insightAbstraction: Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tag, count]) => ({ tag, count })),
      segmentComparison: segments,
      duplicateInsights: duplicates,
      outlierSessions: outliers.map((session) => ({
        id: session.id,
        qualityScore: session.qualityScore,
        qualityFlag: session.qualityFlag,
      })),
    };
  }
}
