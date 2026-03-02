import { Injectable } from "@nestjs/common";
import { BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { getSignedMediaUrl, putObject } from "../../common/s3.client";
import { CreateStoryInput } from "./stories.dto";

@Injectable()
export class StoriesService {
  constructor(private readonly prisma: PrismaService) {}

  list(studyId: string) {
    return this.prisma.story.findMany({ where: { studyId }, orderBy: { createdAt: "desc" } });
  }

  get(id: string) {
    return this.prisma.story.findUnique({ where: { id } });
  }

  async generateMarkdown(id: string) {
    const story = await this.prisma.story.findUniqueOrThrow({ where: { id } });
    const lines = [
      `# ${story.title}`,
      "",
      story.summary ? `> ${story.summary}` : null,
      "",
      story.content,
    ].filter(Boolean) as string[];
    return lines.join("\n");
  }

  async generatePdf(id: string) {
    const story = await this.prisma.story.findUniqueOrThrow({
      where: { id },
      select: { title: true },
    });
    const text = `Sensehub Auto Qual Story\n${story.title}`;
    const pdfBody = `BT /F1 18 Tf 50 750 Td (${text.replaceAll("(", "\\(").replaceAll(")", "\\)")}) Tj ET`;
    const pdf = [
      "%PDF-1.4",
      "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
      "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
      "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj",
      `4 0 obj << /Length ${pdfBody.length} >> stream\n${pdfBody}\nendstream endobj`,
      "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
      "xref",
      "0 6",
      "0000000000 65535 f ",
      "0000000010 00000 n ",
      "0000000060 00000 n ",
      "0000000111 00000 n ",
      "0000000234 00000 n ",
      "0000000336 00000 n ",
      "trailer << /Size 6 /Root 1 0 R >>",
      "startxref",
      "420",
      "%%EOF",
    ].join("\n");
    return pdf;
  }

  private buildExportPayload(story: { title: string; summary?: string | null; content: string }, type: string) {
    if (type === "showreel") {
      return [
        `Showreel script: ${story.title}`,
        story.summary ? `Summary: ${story.summary}` : null,
        "Scene 1: Title card + study objective",
        "Scene 2: Clip montage (3-5 highlights)",
        "Scene 3: Insight overlay bullets",
        "Scene 4: Theme montage and takeaway",
        "Scene 5: Closing + next actions",
      ]
        .filter(Boolean)
        .join("\n");
    }
    if (type === "podcast") {
      return [
        `Podcast script: ${story.title}`,
        story.summary ? `Summary: ${story.summary}` : null,
        "Host: Welcome to the study recap.",
        "Host: Here are the headline insights.",
        story.content,
        "Host: Thanks for listening.",
      ]
        .filter(Boolean)
        .join("\n");
    }
    if (type === "slide") {
      return [
        `Slide export: ${story.title}`,
        story.summary ? `Summary: ${story.summary}` : null,
        "Slide 1: Executive summary",
        "Slide 2: Key insights",
        "Slide 3: Themes & evidence",
        "Slide 4: Recommendations",
      ]
        .filter(Boolean)
        .join("\n");
    }
    throw new BadRequestException("unsupported_export_type");
  }

  async generateExport(storyId: string, type: string) {
    const story = await this.prisma.story.findUniqueOrThrow({
      where: { id: storyId },
      select: { id: true, studyId: true, title: true, summary: true, content: true },
    });
    const payload = this.buildExportPayload(story, type);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const storageKey = `exports/stories/${storyId}/${type}-${timestamp}.txt`;
    await putObject(storageKey, payload, "text/plain");
    const exportRecord = await this.prisma.export.create({
      data: {
        studyId: story.studyId,
        type: `story_${type}`,
        storageKey,
      },
    });
    const url = await getSignedMediaUrl(storageKey);
    return { exportId: exportRecord.id, storageKey, url };
  }

  create(input: CreateStoryInput) {
    return this.prisma.story.create({
      data: {
        studyId: input.studyId,
        type: input.type,
        title: input.title,
        summary: input.summary,
        content: input.content,
        mediaUrl: input.mediaUrl,
      },
    });
  }

  async generate(studyId: string) {
    const insights = await this.prisma.insight.findMany({
      where: { studyId },
      orderBy: { confidenceScore: "desc" },
      take: 5,
    });
    const themes = await this.prisma.theme.findMany({ where: { studyId } });
    const insightLines = insights.map((insight) => `- ${insight.statement}`);
    const themeLines = themes.slice(0, 5).map((theme) => `- ${theme.label}`);

    const article = await this.prisma.story.create({
      data: {
        studyId,
        type: "article",
        title: "Decision-ready insight brief",
        summary: "Narrative overview of key findings with supporting themes and highlights.",
        content: [
          "## Executive summary",
          "This brief distills the most confident insights and the themes that cut across participants.",
          "",
          "## Key insights",
          ...(insightLines.length ? insightLines : ["- No insights available yet."]),
          "",
          "## Themes to watch",
          ...(themeLines.length ? themeLines : ["- Themes will populate as coding completes."]),
        ].join("\n"),
      },
    });

    const podcast = await this.prisma.story.create({
      data: {
        studyId,
        type: "podcast",
        title: "Audio recap script",
        summary: "Short-form script for an internal podcast or audio recap.",
        content: [
          "Host: Welcome to the study recap.",
          "Host: Here are the headline insights from recent interviews.",
          ...insightLines.map((line) => `Host: ${line.replace("- ", "")}`),
          "Host: We also saw recurring themes across sessions.",
          ...themeLines.map((line) => `Host: ${line.replace("- ", "")}`),
          "Host: Thanks for listening.",
        ].join("\n"),
      },
    });

    const video = await this.prisma.story.create({
      data: {
        studyId,
        type: "showreel",
        title: "Story reel outline",
        summary: "Storyboard outline for a short internal insights video.",
        content: [
          "1. Title card: Study purpose and audience.",
          "2. Clip montage: top 3 participant soundbites.",
          "3. Overlay: most confident insights.",
          "4. Theme montage: supporting themes and patterns.",
          "5. Closing: next actions and ownership.",
        ].join("\n"),
      },
    });

    return { created: [article, podcast, video] };
  }
}
