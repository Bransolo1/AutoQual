import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateThemeInput, ThemeSegment } from "./themes.dto";

@Injectable()
export class ThemesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(studyId: string) {
    return this.prisma.theme.findMany({ where: { studyId } });
  }

  async create(input: CreateThemeInput) {
    return this.prisma.theme.create({
      data: {
        studyId: input.studyId,
        label: input.label,
      },
    });
  }

  async listSegments(studyId: string) {
    const themes = await this.prisma.theme.findMany({
      where: { studyId },
      select: { id: true },
    });
    if (!themes.length) {
      return { segments: ["all"] };
    }
    const themeIds = themes.map((theme) => theme.id);
    const segments = await this.prisma.themeMapping.findMany({
      where: { themeId: { in: themeIds } },
      distinct: ["segment"],
      select: { segment: true },
    });
    return { segments: segments.map((entry) => entry.segment) };
  }

  async generateThemes(studyId: string) {
    const insights = await this.prisma.insight.findMany({
      where: { studyId },
      select: { tags: true, statement: true },
    });
    const existingThemes = await this.prisma.theme.findMany({
      where: { studyId },
      select: { id: true, label: true },
    });
    const rawLabels = insights.flatMap((insight) => insight.tags);
    if (existingThemes.length > 0) {
      await this.updateMappings(existingThemes, insights);
      return { created: existingThemes, strategy: "existing" };
    }
    if (rawLabels.length === 0) {
      const fallback = [
        "customer-experience",
        "pricing",
        "product-fit",
        "support",
      ];
      const created = await this.prisma.$transaction(
        fallback.map((label) => this.prisma.theme.create({ data: { studyId, label } })),
      );
      await this.updateMappings(created, insights);
      return { created, strategy: "fallback" };
    }
    const counts = rawLabels.reduce<Record<string, number>>((acc, label) => {
      const key = label.toLowerCase().trim();
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([label]) => label);
    const created = await this.prisma.$transaction(
      sorted.map((label) => this.prisma.theme.create({ data: { studyId, label } })),
    );
    await this.updateMappings(created, insights);
    return { created, strategy: "tags" };
  }

  private async updateMappings(
    themes: Array<{ id: string; label: string }>,
    insights: Array<{ tags: string[]; statement: string }>,
  ) {
    if (!themes.length) return;
    const themeIds = themes.map((theme) => theme.id);
    await this.prisma.themeMapping.deleteMany({ where: { themeId: { in: themeIds } } });
    const mappingCounts: Record<string, ThemeSegment> = {};
    for (const insight of insights) {
      const tags = Array.isArray(insight.tags) ? insight.tags : [];
      const segment =
        tags
          .find((tag) => tag.startsWith("segment:") || tag.startsWith("segment="))
          ?.split(/[:=]/)[1] ?? "all";
      for (const theme of themes) {
        const matches = tags.some((tag) => tag.toLowerCase() === theme.label.toLowerCase());
        if (!matches) continue;
        const key = `${theme.id}:${segment}`;
        if (!mappingCounts[key]) {
          mappingCounts[key] = { segment, insightCount: 0 };
        }
        mappingCounts[key].insightCount += 1;
      }
    }
    const rows = Object.entries(mappingCounts).map(([key, value]) => {
      const [themeId] = key.split(":");
      return {
        themeId,
        segment: value.segment,
        insightCount: value.insightCount,
      };
    });
    if (rows.length) {
      await this.prisma.themeMapping.createMany({ data: rows });
    }
  }
}
