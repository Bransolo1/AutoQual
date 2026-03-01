import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateExportInput } from "./exports.dto";

@Injectable()
export class ExportsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(studyId: string) {
    return this.prisma.export.findMany({ where: { studyId } });
  }

  async create(input: CreateExportInput) {
    const exportRecord = await this.prisma.export.create({
      data: {
        studyId: input.studyId,
        type: input.type,
        storageKey: input.storageKey,
      },
    });
    const study = await this.prisma.study.findUniqueOrThrow({
      where: { id: input.studyId },
      select: { projectId: true, workspaceId: true },
    });
    await this.prisma.attachment.create({
      data: {
        linkedEntityType: "report",
        linkedEntityId: exportRecord.id,
        filename: `export-${exportRecord.id}.${input.type}`,
        storageKey: input.storageKey,
      },
    });
    const approval = await this.prisma.approval.create({
      data: {
        linkedEntityType: "report",
        linkedEntityId: exportRecord.id,
        status: "requested",
        requestedByUserId: "system",
      },
    });
    let stories = await this.prisma.story.findMany({
      where: { studyId: input.studyId },
      select: { id: true },
    });
    if (stories.length === 0) {
      await this.prisma.story.createMany({
        data: [
          {
            studyId: input.studyId,
            type: "article",
            title: "Decision-ready insight brief",
            summary: "Narrative overview of the most confident insights and themes.",
            content: "Auto-generated story placeholder for activation-ready insight brief.",
          },
          {
            studyId: input.studyId,
            type: "podcast",
            title: "Audio recap script",
            summary: "Auto-generated audio recap for internal distribution.",
            content: "Host: Welcome to the recap. This is an auto-generated placeholder.",
          },
          {
            studyId: input.studyId,
            type: "video",
            title: "Story reel outline",
            summary: "Storyboard outline for an insights reel.",
            content: "Storyboard: title card, clips montage, insight overlays, closing.",
          },
        ],
      });
      stories = await this.prisma.story.findMany({
        where: { studyId: input.studyId },
        select: { id: true },
      });
    }
    const deliverableApproval = await this.prisma.approval.create({
      data: {
        linkedEntityType: "deliverable_pack",
        linkedEntityId: input.studyId,
        status: "requested",
        requestedByUserId: "system",
      },
    });
    await this.prisma.auditEvent.create({
      data: {
        workspaceId: study.workspaceId,
        actorUserId: "system",
        action: "approval.created",
        entityType: "approval",
        entityId: approval.id,
        metadata: { linkedEntityType: "report", linkedEntityId: exportRecord.id },
      },
    });
    await this.prisma.auditEvent.create({
      data: {
        workspaceId: study.workspaceId,
        actorUserId: "system",
        action: "approval.created",
        entityType: "approval",
        entityId: deliverableApproval.id,
        metadata: {
          linkedEntityType: "deliverable_pack",
          linkedEntityId: input.studyId,
          reportExportId: exportRecord.id,
          storyIds: stories.map((story) => story.id),
        },
      },
    });
    await this.prisma.notification.create({
      data: {
        userId: "demo-user",
        type: "approval.requested",
        payload: {
          approvalType: "report",
          approvalId: approval.id,
          reportId: exportRecord.id,
          studyId: input.studyId,
        },
      },
    });
    await this.prisma.notification.create({
      data: {
        userId: "demo-user",
        type: "approval.requested",
        payload: {
          approvalType: "deliverable_pack",
          approvalId: deliverableApproval.id,
          studyId: input.studyId,
          reportExportId: exportRecord.id,
          storyIds: stories.map((story) => story.id),
        },
      },
    });
    await this.prisma.notification.create({
      data: {
        userId: "demo-user",
        type: "deliverable.pack.ready",
        payload: {
          approvalId: deliverableApproval.id,
          studyId: input.studyId,
          reportExportId: exportRecord.id,
          storyIds: stories.map((story) => story.id),
        },
      },
    });
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: study.workspaceId },
      select: { activationViewThreshold: true, feedbackScoreThreshold: true },
    });
    const activationViewThreshold = workspace?.activationViewThreshold ?? 10;
    const feedbackScoreThreshold = workspace?.feedbackScoreThreshold ?? 3;
    const activationMetrics = await this.prisma.activationMetric.findMany({
      where: { studyId: input.studyId },
      select: { views: true },
    });
    const totalViews = activationMetrics.reduce((sum, metric) => sum + (metric.views ?? 0), 0);
    const feedback = await this.prisma.stakeholderFeedback.findMany({
      where: { studyId: input.studyId },
      select: { rating: true },
    });
    const rated = feedback.filter((item) => typeof item.rating === "number");
    const avgRating =
      rated.length === 0
        ? null
        : rated.reduce((sum, item) => sum + (item.rating as number), 0) / rated.length;
    const lowActivation = totalViews < activationViewThreshold;
    const lowFeedback = avgRating !== null && avgRating < feedbackScoreThreshold;
    if (lowActivation || lowFeedback) {
      await this.prisma.alertEvent.create({
        data: {
          workspaceId: study.workspaceId,
          type: "adoption.alert",
          severity: lowFeedback ? "critical" : "warning",
          payload: {
            studyId: input.studyId,
            reportExportId: exportRecord.id,
            totalViews,
            avgRating,
            activationViewThreshold,
            feedbackScoreThreshold,
          },
        },
      });
      await this.prisma.notification.create({
        data: {
          userId: "demo-user",
          type: "adoption.alert",
          payload: {
            studyId: input.studyId,
            reportExportId: exportRecord.id,
            totalViews,
            avgRating,
            activationViewThreshold,
            feedbackScoreThreshold,
          },
        },
      });
    }
    return exportRecord;
  }

  async generateMarkdown(studyId: string) {
    const study = await this.prisma.study.findUniqueOrThrow({
      where: { id: studyId },
      include: {
        insights: true,
        themes: true,
        participants: true,
      },
    });
    const transcripts = await this.prisma.transcript.findMany({
      where: { session: { studyId } },
      select: { redactedContent: true, content: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
    const transcriptSnippets = transcripts
      .map((t) => (t.redactedContent || t.content || "").trim())
      .filter(Boolean)
      .map((text) => (text.length > 160 ? `${text.slice(0, 157)}...` : text));
    const segmentCounts = study.participants.reduce<Record<string, number>>((acc, participant) => {
      const key = participant.segment || "unassigned";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
    const themeCounts = study.themes.reduce<Record<string, number>>((acc, theme) => {
      acc[theme.label] = (acc[theme.label] ?? 0) + 1;
      return acc;
    }, {});
    const lines: string[] = [
      `# ${study.name}`,
      "",
      "## Executive summary",
      "",
      `Study: ${study.name} (${study.id}).`,
      "",
      "## Segment comparison",
      "",
      ...Object.entries(segmentCounts).map(([segment, count]) => `- ${segment}: ${count}`),
      "",
      "## Theme quantification",
      "",
      ...Object.entries(themeCounts).map(([label, count]) => `- ${label}: ${count}`),
      "",
      "## Quote traceability",
      "",
      ...transcriptSnippets.map((snippet) => `- "${snippet}"`),
      "",
      "## Video proof embedding",
      "",
      "Video clips are available via signed URLs. Use Evidence Viewer to access clips securely.",
      "",
      "## Insights",
      "",
    ];
    study.insights.forEach((i) => {
      lines.push(`- **${i.statement}**`);
      lines.push(`  - Confidence: ${i.confidenceScore}`);
      lines.push(`  - Implication: ${i.businessImplication}`);
      lines.push("");
    });
    return lines.join("\n");
  }

  async generateJson(studyId: string) {
    const study = await this.prisma.study.findUniqueOrThrow({
      where: { id: studyId },
      include: {
        insights: true,
        themes: true,
        participants: true,
      },
    });
    const transcripts = await this.prisma.transcript.findMany({
      where: { session: { studyId } },
      select: { redactedContent: true, content: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
    const transcriptSnippets = transcripts
      .map((t) => (t.redactedContent || t.content || "").trim())
      .filter(Boolean)
      .map((text) => (text.length > 160 ? `${text.slice(0, 157)}...` : text));
    const segmentCounts = study.participants.reduce<Record<string, number>>((acc, participant) => {
      const key = participant.segment || "unassigned";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
    const themeCounts = study.themes.reduce<Record<string, number>>((acc, theme) => {
      acc[theme.label] = (acc[theme.label] ?? 0) + 1;
      return acc;
    }, {});
    const clips = await this.prisma.clip.findMany({
      where: { mediaArtifact: { session: { studyId } } },
      select: { id: true, mediaArtifactId: true, startMs: true, endMs: true },
      take: 10,
      orderBy: { createdAt: "desc" },
    });
    return {
      study: { id: study.id, name: study.name, status: study.status },
      segmentSummary: segmentCounts,
      themeQuantification: themeCounts,
      transcriptSnippets,
      videoClips: clips,
      insights: study.insights.map((i) => ({
        id: i.id,
        statement: i.statement,
        confidenceScore: i.confidenceScore,
        businessImplication: i.businessImplication,
        tags: i.tags,
      })),
    };
  }

  async generatePptOutline(studyId: string) {
    const study = await this.prisma.study.findUniqueOrThrow({
      where: { id: studyId },
      include: {
        insights: true,
        themes: true,
        participants: true,
      },
    });
    const transcripts = await this.prisma.transcript.findMany({
      where: { session: { studyId } },
      select: { redactedContent: true, content: true },
      orderBy: { createdAt: "desc" },
      take: 3,
    });
    const transcriptSnippets = transcripts
      .map((t) => (t.redactedContent || t.content || "").trim())
      .filter(Boolean)
      .map((text) => (text.length > 120 ? `${text.slice(0, 117)}...` : text));
    const segmentCounts = study.participants.reduce<Record<string, number>>((acc, participant) => {
      const key = participant.segment || "unassigned";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
    const themeCounts = study.themes.reduce<Record<string, number>>((acc, theme) => {
      acc[theme.label] = (acc[theme.label] ?? 0) + 1;
      return acc;
    }, {});
    return [
      { title: "Executive Summary", bullets: [`Study: ${study.name}`] },
      {
        title: "Segment Comparison",
        bullets: Object.entries(segmentCounts).map(([segment, count]) => `${segment}: ${count}`),
      },
      {
        title: "Theme Quantification",
        bullets: Object.entries(themeCounts).map(([label, count]) => `${label}: ${count}`),
      },
      {
        title: "Quote Traceability",
        bullets: transcriptSnippets.length ? transcriptSnippets : ["No transcripts available yet."],
      },
      {
        title: "Key Insights",
        bullets: study.insights.map((i) => `${i.statement} (confidence ${i.confidenceScore})`),
      },
      {
        title: "Business Implications",
        bullets: study.insights.map((i) => i.businessImplication),
      },
    ];
  }

  async generateAudioRecap(studyId: string) {
    const study = await this.prisma.study.findUniqueOrThrow({
      where: { id: studyId },
      include: { insights: true },
    });
    const highlight = study.insights.slice(0, 3).map((i) => i.statement).join(" ");
    const script = `Audio recap for ${study.name}. Key highlights: ${highlight || "No insights yet."}`;
    return {
      script,
      estimatedSeconds: Math.max(20, Math.min(120, Math.round(script.length / 8))),
    };
  }

  async generatePdf(studyId: string) {
    const study = await this.prisma.study.findUniqueOrThrow({
      where: { id: studyId },
      select: { name: true },
    });
    const text = `Sensehub Auto Qual Report\nStudy: ${study.name}`;
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

  async generateEvidenceBundle(studyId: string) {
    const clips = await this.prisma.clip.findMany({
      where: { mediaArtifact: { session: { studyId } } },
      include: { mediaArtifact: true },
      take: 20,
    });
    return {
      studyId,
      clips: clips.map((clip) => ({
        id: clip.id,
        mediaArtifactId: clip.mediaArtifactId,
        startMs: clip.startMs,
        endMs: clip.endMs,
        storageKey: clip.mediaArtifact.storageKey,
      })),
      generatedAt: new Date().toISOString(),
    };
  }

  async generateDeliverables(studyId: string) {
    const [exportsList, stories, study] = await Promise.all([
      this.prisma.export.findMany({
        where: { studyId },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.story.findMany({
        where: { studyId },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.study.findUniqueOrThrow({ where: { id: studyId }, select: { name: true } }),
    ]);
    return {
      studyId,
      studyName: study.name,
      reports: exportsList.map((exportItem) => ({
        id: exportItem.id,
        type: exportItem.type,
        createdAt: exportItem.createdAt,
        downloads: {
          markdown: `/exports/study/${studyId}/markdown`,
          pdf: `/exports/study/${studyId}/pdf`,
          pptOutline: `/exports/study/${studyId}/ppt-outline`,
        },
      })),
      stories: stories.map((story) => ({
        id: story.id,
        type: story.type,
        title: story.title,
        createdAt: story.createdAt,
        downloads: {
          markdown: `/exports/story/${story.id}/markdown`,
          pdf: `/exports/story/${story.id}/pdf`,
          audioScript: `/exports/story/${story.id}/audio-script`,
        },
      })),
    };
  }

  async generateStoryMarkdown(storyId: string) {
    const story = await this.prisma.story.findUniqueOrThrow({
      where: { id: storyId },
      include: { study: true },
    });
    const lines = [
      `# ${story.title}`,
      "",
      `Study: ${story.study.name}`,
      `Type: ${story.type}`,
      "",
      story.summary ? `> ${story.summary}` : "",
      story.summary ? "" : "",
      story.content,
    ].filter((line) => line !== "");
    return lines.join("\n");
  }

  async generateStoryPdf(storyId: string) {
    const story = await this.prisma.story.findUniqueOrThrow({
      where: { id: storyId },
      select: { title: true, summary: true },
    });
    const text = `Sensehub Story\n${story.title}${story.summary ? `\n${story.summary}` : ""}`;
    const pdfBody = `BT /F1 14 Tf 50 750 Td (${text.replaceAll("(", "\\(").replaceAll(")", "\\)")}) Tj ET`;
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

  async generateStoryAudioScript(storyId: string) {
    const story = await this.prisma.story.findUniqueOrThrow({
      where: { id: storyId },
      select: { title: true, type: true, content: true },
    });
    const script =
      story.type === "podcast"
        ? story.content
        : `Host: ${story.title}\nHost: ${story.content.replace(/\n/g, " ")}`;
    return {
      script,
      estimatedSeconds: Math.max(20, Math.min(180, Math.round(script.length / 8))),
    };
  }
}
