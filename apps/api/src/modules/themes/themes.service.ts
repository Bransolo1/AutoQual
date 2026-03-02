import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateThemeInput } from "./themes.dto";

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
        label: input.label
      }
    });
  }

  async generateThemes(studyId: string) {
    const insights = await this.prisma.insight.findMany({
      where: { studyId },
      select: { tags: true, statement: true },
    });
    const rawLabels = insights.flatMap((insight) => insight.tags);
    if (rawLabels.length === 0) {
      const fallback = [
        "customer-experience",
        "pricing",
        "product-fit",
        "support",
      ];
      const created = await this.prisma.$transaction(
        fallback.map((label) => this.prisma.theme.create({ data: { studyId, label } }))
      );
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
      sorted.map((label) => this.prisma.theme.create({ data: { studyId, label } }))
    );
    return { created, strategy: "tags" };
  }
}
