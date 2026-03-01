import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateProjectInput } from "./projects.dto";
import { DEFAULT_MILESTONES, MILESTONE_TASK_TEMPLATES } from "./intake-templates";

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async list({
    workspaceId,
    status,
    ownerUserId,
    query,
  }: {
    workspaceId: string;
    status?: string;
    ownerUserId?: string;
    query?: string;
  }) {
    return this.prisma.project.findMany({
      where: {
        workspaceId,
        status: status || undefined,
        ownerUserId: ownerUserId || undefined,
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { clientOrgName: { contains: query, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: { milestones: { orderBy: { orderIndex: "asc" } } },
    });
  }

  async getById(id: string) {
    return this.prisma.project.findUniqueOrThrow({
      where: { id },
      include: {
        milestones: { orderBy: { orderIndex: "asc" } },
        tasks: { include: { comments: true } },
      },
    });
  }

  async getClientView(projectId: string) {
    const project = await this.prisma.project.findUniqueOrThrow({
      where: { id: projectId },
      include: {
        milestones: { orderBy: { orderIndex: "asc" } },
        studies: { include: { insights: true } },
      },
    });
    const artifacts = await this.prisma.mediaArtifact.findMany({
      where: { session: { study: { projectId } } },
      include: { clips: true },
      take: 10,
    });
    const transcripts = await this.prisma.transcript.findMany({
      where: { session: { study: { projectId } } },
      select: { redactedContent: true, content: true },
      take: 5,
      orderBy: { createdAt: "desc" },
    });
    const transcriptSnippets = transcripts
      .map((t) => (t.redactedContent || t.content || "").trim())
      .filter(Boolean)
      .map((text) => (text.length > 160 ? `${text.slice(0, 157)}...` : text));
    const defaultSnippet = transcriptSnippets[0] ?? "Transcript unavailable.";
    const approvals = await this.prisma.approval.findMany({
      where: { status: "approved" },
      take: 20,
    });
    const approvedInsightIds = new Set(
      approvals.filter((a) => a.linkedEntityType === "insight_set").map((a) => a.linkedEntityId),
    );
    const insightHeadlines = project.studies.flatMap((s) =>
      s.insights
        .filter((i) => i.status === "approved" || approvedInsightIds.has(s.id))
        .map((i) => ({ id: i.id, statement: i.statement })),
    );
    const localizationReadiness = project.studies.map((study) => {
      const checklist = (study as { localizationChecklist?: Record<string, boolean> }).localizationChecklist ?? {};
      const entries = Object.entries(checklist);
      const completed = entries.filter(([, value]) => value).length;
      const total = entries.length;
      const missing = entries.filter(([, value]) => !value).map(([key]) => key);
      return {
        studyId: study.id,
        language: study.language,
        readinessPercent: total ? Math.round((completed / total) * 100) : 0,
        missing,
      };
    });
    const recruitmentReadiness = project.studies.map((study) => {
      const checklist = (study as { recruitmentChecklist?: Record<string, boolean> }).recruitmentChecklist ?? {};
      const entries = Object.entries(checklist);
      const completed = entries.filter(([, value]) => value).length;
      const total = entries.length;
      const missing = entries.filter(([, value]) => !value).map(([key]) => key);
      return {
        studyId: study.id,
        readinessPercent: total ? Math.round((completed / total) * 100) : 0,
        missing,
      };
    });
    const activationReadiness = project.studies.map((study) => {
      const checklist = (study as { activationChecklist?: Record<string, boolean> }).activationChecklist ?? {};
      const entries = Object.entries(checklist);
      const completed = entries.filter(([, value]) => value).length;
      const total = entries.length;
      const missing = entries.filter(([, value]) => !value).map(([key]) => key);
      return {
        studyId: study.id,
        readinessPercent: total ? Math.round((completed / total) * 100) : 0,
        missing,
      };
    });
    const rolloutReadiness = project.studies.map((study) => {
      const rollout = (study as { rolloutPlan?: { markets?: string[]; status?: string } }).rolloutPlan ?? {};
      return {
        studyId: study.id,
        markets: rollout.markets ?? [],
        status: rollout.status ?? "draft",
      };
    });
    const distributionTracking = project.studies.map((study) => {
      const tracking =
        (study as { distributionTracking?: { channels?: string[]; measurement?: string } })
          .distributionTracking ?? {};
      return {
        studyId: study.id,
        channels: tracking.channels ?? [],
        measurement: tracking.measurement ?? "",
      };
    });
    const deliveryHealth = project.studies.map((study) => {
      const health =
        (study as { deliveryHealth?: { score?: number; status?: string; notes?: string } })
          .deliveryHealth ?? {};
      return {
        studyId: study.id,
        score: typeof health.score === "number" ? health.score : 0,
        status: health.status ?? "unknown",
        notes: health.notes ?? "",
      };
    });
    const activationMetrics = await this.prisma.activationMetric.findMany({
      where: { projectId },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });
    const studyIds = project.studies.map((study) => study.id);
    return {
      name: project.name,
      clientOrgName: project.clientOrgName,
      studyIds,
      localizationReadiness,
      recruitmentReadiness,
      activationReadiness,
      rolloutReadiness,
      distributionTracking,
      deliveryHealth,
      activationMetrics: activationMetrics.map((metric) => ({
        id: metric.id,
        studyId: metric.studyId,
        deliverableType: metric.deliverableType,
        deliverableId: metric.deliverableId,
        views: metric.views,
        shares: metric.shares,
        decisionsLogged: metric.decisionsLogged,
        updatedAt: metric.updatedAt,
      })),
      milestones: project.milestones.map((m) => ({
        name: m.name,
        status: m.status,
        dueDate: m.dueDate,
      })),
      approvedDeliverables: approvals.map((a) => ({
        type: a.linkedEntityType,
        id: a.linkedEntityId,
      })),
      insightHeadlines,
      evidenceClips: artifacts.flatMap((a) =>
        a.clips.map((c) => ({
          id: c.id,
          mediaArtifactId: a.id,
          startMs: c.startMs,
          endMs: c.endMs,
          transcriptSnippet: defaultSnippet,
        })),
      ),
      transcriptSnippets,
    };
  }

  async updateShareChecklist(
    projectId: string,
    input: { workspaceId: string; actorUserId: string; items: Record<string, boolean> },
  ) {
    const checklist = await this.prisma.shareChecklist.upsert({
      where: { projectId },
      update: { items: input.items },
      create: {
        projectId,
        workspaceId: input.workspaceId,
        items: input.items,
      },
      select: { projectId: true, items: true, updatedAt: true },
    });
    await this.prisma.auditEvent.create({
      data: {
        workspaceId: input.workspaceId,
        actorUserId: input.actorUserId,
        action: "share.checklist.updated",
        entityType: "project",
        entityId: projectId,
        metadata: { itemCount: Object.keys(input.items ?? {}).length },
      },
    });
    return checklist;
  }

  async getAnalysisDelivery(projectId: string) {
    const project = await this.prisma.project.findUniqueOrThrow({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        clientOrgName: true,
        status: true,
        targetDeliveryDate: true,
        studies: { select: { id: true, name: true, status: true } },
      },
    });
    const studyIds = project.studies.map((study) => study.id);
    if (studyIds.length === 0) {
      return {
        project,
        studies: project.studies,
        insights: [],
        themes: [],
        exports: [],
        stories: [],
        approvals: [],
        evidenceClips: [],
        transcriptSnippets: [],
        timeline: [],
      };
    }

    const [
      insights,
      themes,
      exports,
      stories,
      approvals,
      clips,
      transcripts,
      milestones,
      tasks,
      shareChecklist,
    ] = await Promise.all([
      this.prisma.insight.findMany({
        where: { studyId: { in: studyIds }, status: "approved" },
        select: {
          id: true,
          studyId: true,
          statement: true,
          status: true,
          confidenceScore: true,
          businessImplication: true,
          tags: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: "desc" },
      }),
      this.prisma.theme.findMany({
        where: { studyId: { in: studyIds } },
        select: { id: true, studyId: true, label: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.export.findMany({
        where: { studyId: { in: studyIds } },
        select: { id: true, studyId: true, type: true, storageKey: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.story.findMany({
        where: { studyId: { in: studyIds } },
        select: { id: true, studyId: true, type: true, title: true, summary: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.approval.findMany({
        where: {
          OR: [
            { linkedEntityType: "deliverable_pack", linkedEntityId: { in: studyIds } },
            { linkedEntityType: "insight_set", linkedEntityId: { in: studyIds } },
          ],
        },
      }),
      this.prisma.clip.findMany({
        where: { mediaArtifact: { session: { studyId: { in: studyIds } } } },
        select: { id: true, mediaArtifactId: true, startMs: true, endMs: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.transcript.findMany({
        where: { session: { studyId: { in: studyIds } } },
        select: { redactedContent: true, content: true },
        orderBy: { createdAt: "desc" },
        take: 12,
      }),
      this.prisma.milestone.findMany({
        where: { projectId },
        select: { id: true, name: true, status: true, dueDate: true },
        orderBy: { orderIndex: "asc" },
      }),
      this.prisma.task.findMany({
        where: { projectId, status: { in: ["blocked", "todo", "in_progress"] } },
        select: { id: true, title: true, status: true, dueDate: true, blockedReason: true },
        orderBy: { dueDate: "asc" },
      }),
      this.prisma.shareChecklist.findUnique({
        where: { projectId },
        select: { items: true, updatedAt: true },
      }),
    ]);

    const exportIds = exports.map((item) => item.id);
    const reportApprovals =
      exportIds.length === 0
        ? []
        : await this.prisma.approval.findMany({
            where: { linkedEntityType: "report", linkedEntityId: { in: exportIds } },
          });

    const approvedReportIds = new Set(
      reportApprovals.filter((approval) => approval.status === "approved").map((approval) => approval.linkedEntityId),
    );
    const approvedDeliverableStudyIds = new Set(
      approvals
        .filter((approval) => approval.linkedEntityType === "deliverable_pack" && approval.status === "approved")
        .map((approval) => approval.linkedEntityId),
    );
    const visibleExports = exports.filter((item) => approvedReportIds.has(item.id));
    const visibleStories = stories.filter((item) => approvedDeliverableStudyIds.has(item.studyId));

    const transcriptSnippets = transcripts
      .map((t) => (t.redactedContent || t.content || "").trim())
      .filter(Boolean)
      .map((text) => (text.length > 160 ? `${text.slice(0, 157)}...` : text));

    const timeline = [
      ...visibleExports.map((item) => ({
        type: "report_export",
        id: item.id,
        studyId: item.studyId,
        label: `${item.type.toUpperCase()} export generated`,
        createdAt: item.createdAt,
      })),
      ...visibleStories.map((item) => ({
        type: "story",
        id: item.id,
        studyId: item.studyId,
        label: `${item.type} story published`,
        createdAt: item.createdAt,
      })),
      ...insights.map((item) => ({
        type: "insight",
        id: item.id,
        studyId: item.studyId,
        label: item.statement,
        createdAt: item.updatedAt,
      })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return {
      project,
      studies: project.studies,
      insights,
      themes,
      exports: visibleExports,
      stories: visibleStories,
      approvals: [...approvals, ...reportApprovals],
      evidenceClips: clips,
      transcriptSnippets,
      shareChecklist: shareChecklist
        ? { items: shareChecklist.items as Record<string, boolean>, updatedAt: shareChecklist.updatedAt }
        : { items: {}, updatedAt: null },
      risks: {
        overdueMilestones: milestones.filter(
          (milestone) => milestone.status !== "done" && milestone.dueDate.getTime() < Date.now(),
        ),
        blockedTasks: tasks.filter((task) => task.status === "blocked"),
        overdueTasks: tasks.filter(
          (task) => task.dueDate && task.dueDate.getTime() < Date.now() && task.status !== "done",
        ),
        pendingApprovals: approvals.filter((approval) => approval.status === "requested"),
      },
      timeline: timeline.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() })),
    };
  }

  async create(input: CreateProjectInput) {
    const start = new Date(input.startDate);
    const end = new Date(input.targetDeliveryDate);
    const span = (end.getTime() - start.getTime()) / (DEFAULT_MILESTONES.length + 1);

    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          workspaceId: input.workspaceId,
          name: input.name,
          description: input.description,
          status: input.status,
          ownerUserId: input.ownerUserId,
          clientOrgName: input.clientOrgName,
          startDate: start,
          targetDeliveryDate: end,
          tags: input.tags,
        },
      });

      for (let i = 0; i < DEFAULT_MILESTONES.length; i++) {
        const name = DEFAULT_MILESTONES[i];
        const dueDate = new Date(start.getTime() + (i + 1) * span);
        const milestone = await tx.milestone.create({
          data: {
            projectId: project.id,
            name,
            dueDate,
            status: i === 0 ? "in_progress" : "not_started",
            orderIndex: i + 1,
          },
        });

        const templates = MILESTONE_TASK_TEMPLATES[name] ?? [];
        for (const t of templates) {
          await tx.task.create({
            data: {
              projectId: project.id,
              milestoneId: milestone.id,
              title: t.title,
              description: t.description,
              status: "todo",
              priority: "medium",
              dueDate,
              dependencies: [],
            },
          });
        }
      }

      return tx.project.findUniqueOrThrow({
        where: { id: project.id },
        include: { milestones: { orderBy: { orderIndex: "asc" }, include: { tasks: true } } },
      });
    });
  }
}
