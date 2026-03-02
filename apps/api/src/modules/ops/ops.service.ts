import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { QueueService } from "../../queue/queue.service";

@Injectable()
export class OpsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
  ) {}

  async getDashboard(workspaceId: string) {
    const now = new Date();

    const lastWeek = new Date(now.getTime() - 7 * 86400000);
    const [
      tasks,
      projects,
      completedProjects,
      sessionsThisWeek,
      reportsThisWeek,
      participants,
      feedback,
      activationMetrics,
    ] = await Promise.all([
      this.prisma.task.findMany({
        where: { project: { workspaceId } },
        include: { project: true },
      }),
      this.prisma.project.findMany({
        where: { workspaceId },
        select: { id: true, name: true, targetDeliveryDate: true, status: true },
      }),
      this.prisma.project.findMany({
        where: { workspaceId, status: "complete" },
        select: { startDate: true, updatedAt: true },
      }),
      this.prisma.session.count({
        where: { createdAt: { gte: lastWeek }, study: { workspaceId } },
      }),
      this.prisma.export.count({
        where: { createdAt: { gte: lastWeek }, study: { workspaceId } },
      }),
      this.prisma.participant.findMany({
        where: { study: { workspaceId } },
        select: { verificationStatus: true },
      }),
      this.prisma.stakeholderFeedback.findMany({
        where: { workspaceId },
        select: { rating: true, sentiment: true, deliverableType: true, createdAt: true },
      }),
      this.prisma.activationMetric.findMany({
        where: { workspaceId },
        select: { views: true, shares: true, decisionsLogged: true, deliverableType: true, createdAt: true },
      }),
    ]);

    const overdue = tasks.filter((t) => new Date(t.dueDate) < now && t.status !== "done");
    const blocked = tasks.filter((t) => t.status === "blocked");
    const byAssignee = tasks.reduce<Record<string, number>>((acc, t) => {
      const key = t.assigneeUserId ?? "unassigned";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    const deliveryRisk = projects.filter(
      (p) =>
        p.status === "active" &&
        new Date(p.targetDeliveryDate) < new Date(now.getTime() + 7 * 86400000),
    );

    const cycleTimeDays =
      completedProjects.length === 0
        ? null
        : completedProjects.reduce((acc, project) => {
            const diffMs = project.updatedAt.getTime() - project.startDate.getTime();
            return acc + diffMs / 86400000;
          }, 0) / completedProjects.length;

    const verificationCounts = participants.reduce<Record<string, number>>((acc, participant) => {
      const key = participant.verificationStatus || "pending";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    const sentimentCounts = feedback.reduce<Record<string, number>>((acc, item) => {
      const key = item.sentiment ?? "unspecified";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
    const feedbackByDeliverable = feedback.reduce<
      Record<string, { total: number; avgRating: number | null }>
    >((acc, item) => {
      const key = (item as { deliverableType?: string }).deliverableType ?? "unknown";
      acc[key] = acc[key] ?? { total: 0, avgRating: null };
      acc[key].total += 1;
      if (typeof item.rating === "number") {
        const prevTotal = acc[key].avgRating
          ? acc[key].avgRating * (acc[key].total - 1)
          : 0;
        acc[key].avgRating = Math.round(((prevTotal + item.rating) / acc[key].total) * 10) / 10;
      }
      return acc;
    }, {});
    const rated = feedback.filter((item) => typeof item.rating === "number");
    const avgRating =
      rated.length === 0
        ? null
        : rated.reduce((sum, item) => sum + (item.rating as number), 0) / rated.length;
    const weekKey = (date: Date) => {
      const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
      const day = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() - day + 1);
      return d.toISOString().slice(0, 10);
    };
    const feedbackTrend = feedback.reduce<Record<string, { count: number; avgRating: number | null }>>(
      (acc, item) => {
        const key = weekKey(item.createdAt);
        acc[key] = acc[key] ?? { count: 0, avgRating: null };
        acc[key].count += 1;
        if (typeof item.rating === "number") {
          const prevTotal = acc[key].avgRating ? acc[key].avgRating * (acc[key].count - 1) : 0;
          acc[key].avgRating = Math.round(((prevTotal + item.rating) / acc[key].count) * 10) / 10;
        }
        return acc;
      },
      {},
    );

    const activationTotals = activationMetrics.reduce(
      (acc, metric) => {
        acc.totalViews += metric.views ?? 0;
        acc.totalShares += metric.shares ?? 0;
        acc.totalDecisionsLogged += metric.decisionsLogged ?? 0;
        return acc;
      },
      { totalViews: 0, totalShares: 0, totalDecisionsLogged: 0 },
    );
    const activationByDeliverable = activationMetrics.reduce<
      Record<string, { totalViews: number; totalShares: number; totalDecisionsLogged: number }>
    >((acc, metric) => {
      const key = metric.deliverableType ?? "unknown";
      acc[key] = acc[key] ?? { totalViews: 0, totalShares: 0, totalDecisionsLogged: 0 };
      acc[key].totalViews += metric.views ?? 0;
      acc[key].totalShares += metric.shares ?? 0;
      acc[key].totalDecisionsLogged += metric.decisionsLogged ?? 0;
      return acc;
    }, {});
    const activationTrend = activationMetrics.reduce<
      Record<string, { deliverableType: string; totalViews: number; totalShares: number; totalDecisionsLogged: number }>
    >((acc, metric) => {
      const week = weekKey(metric.createdAt);
      const key = `${metric.deliverableType ?? "unknown"}:${week}`;
      acc[key] = acc[key] ?? {
        deliverableType: metric.deliverableType ?? "unknown",
        totalViews: 0,
        totalShares: 0,
        totalDecisionsLogged: 0,
      };
      acc[key].totalViews += metric.views ?? 0;
      acc[key].totalShares += metric.shares ?? 0;
      acc[key].totalDecisionsLogged += metric.decisionsLogged ?? 0;
      return acc;
    }, {});

    return {
      workloadByAssignee: Object.entries(byAssignee).map(([assignee, count]) => ({ assignee, count })),
      overdueTasks: overdue.length,
      overdueTaskIds: overdue.map((t) => t.id),
      overdueTaskDetails: overdue.map((t) => ({
        id: t.id,
        title: t.title,
        assigneeUserId: t.assigneeUserId,
        dueDate: t.dueDate,
        projectId: t.projectId,
      })),
      blockedTasks: blocked.map((t) => ({
        id: t.id,
        title: t.title,
        projectId: t.projectId,
        blockedReason: t.blockedReason,
        blockedByTaskId: t.blockedByTaskId,
      })),
      deliveryRiskProjects: deliveryRisk.map((p) => ({ id: p.id, name: p.name, targetDeliveryDate: p.targetDeliveryDate })),
      cycleTimeDays,
      throughputInterviewsThisWeek: sessionsThisWeek,
      throughputReportsThisWeek: reportsThisWeek,
      recruitmentVerification: {
        pending: verificationCounts.pending ?? 0,
        verified: verificationCounts.verified ?? 0,
        flagged: verificationCounts.flagged ?? 0,
        rejected: verificationCounts.rejected ?? 0,
      },
      stakeholderFeedback: {
        total: feedback.length,
        avgRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
        sentiment: {
          positive: sentimentCounts.positive ?? 0,
          neutral: sentimentCounts.neutral ?? 0,
          negative: sentimentCounts.negative ?? 0,
          unspecified: sentimentCounts.unspecified ?? 0,
        },
        byDeliverableType: feedbackByDeliverable,
        trendWeekly: Object.entries(feedbackTrend)
          .sort(([a], [b]) => (a < b ? -1 : 1))
          .map(([week, values]) => ({ week, ...values })),
      },
      activationMetrics: activationTotals,
      activationByDeliverableType: activationByDeliverable,
      activationTrendWeekly: Object.entries(activationTrend)
        .map(([key, values]) => {
          const week = key.split(":").slice(1).join(":");
          return { week, ...values };
        })
        .sort((a, b) => (a.week < b.week ? -1 : 1)),
    };
  }

  async getSecurityAlerts(workspaceId: string, limit = 20) {
    const securityActions = new Map<string, { severity: string; summary: string }>([
      ["token.revoked", { severity: "warning", summary: "Token revoked" }],
      ["audit.exported", { severity: "info", summary: "Audit log exported" }],
      ["workspace.settings.updated", { severity: "info", summary: "Workspace settings updated" }],
      ["trust_artifact.created", { severity: "info", summary: "Trust artifact added" }],
      ["trust_artifact.updated", { severity: "info", summary: "Trust artifact updated" }],
      ["alert.created", { severity: "info", summary: "Alert created" }],
    ]);

    const events = await this.prisma.auditEvent.findMany({
      where: {
        workspaceId,
        action: { in: Array.from(securityActions.keys()) },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return events.map((event) => ({
      id: event.id,
      action: event.action,
      actorUserId: event.actorUserId,
      entityType: event.entityType,
      entityId: event.entityId,
      createdAt: event.createdAt,
      metadata: event.metadata,
      severity: securityActions.get(event.action)?.severity ?? "info",
      summary: securityActions.get(event.action)?.summary ?? event.action,
    }));
  }

  async refreshAlerts(workspaceId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { activationViewThreshold: true, feedbackScoreThreshold: true },
    });
    if (!workspace) return { created: 0, skipped: "workspace_not_found" };

    const now = new Date();
    const windowStart = new Date(now.getTime() - 28 * 86400000);

    const [activationTotals, feedbackStats, deliveryRiskProjects] = await Promise.all([
      this.prisma.activationMetric.aggregate({
        where: { workspaceId, createdAt: { gte: windowStart } },
        _sum: { views: true },
      }),
      this.prisma.stakeholderFeedback.aggregate({
        where: { workspaceId, createdAt: { gte: windowStart } },
        _avg: { rating: true },
        _count: { rating: true },
      }),
      this.prisma.project.findMany({
        where: {
          workspaceId,
          status: "active",
          targetDeliveryDate: { lte: new Date(now.getTime() + 7 * 86400000) },
        },
        select: { id: true, name: true, targetDeliveryDate: true },
      }),
    ]);

    const recentWindow = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recentAlerts = await this.prisma.alertEvent.findMany({
      where: { workspaceId, createdAt: { gte: recentWindow } },
      select: { type: true },
    });
    const recentlyEmitted = new Set(recentAlerts.map((alert) => alert.type));

    const alertsToCreate: { type: string; severity: string; payload: Record<string, unknown> }[] = [];

    const totalViews = activationTotals._sum.views ?? 0;
    const activationThreshold = workspace.activationViewThreshold ?? 10;
    if (totalViews < activationThreshold && !recentlyEmitted.has("activation.low_views")) {
      alertsToCreate.push({
        type: "activation.low_views",
        severity: "warning",
        payload: { totalViews, threshold: activationThreshold, windowDays: 28 },
      });
    }

    const avgRating = feedbackStats._avg.rating ?? null;
    const feedbackThreshold = workspace.feedbackScoreThreshold ?? 3;
    if (avgRating !== null && avgRating < feedbackThreshold && !recentlyEmitted.has("feedback.low_score")) {
      alertsToCreate.push({
        type: "feedback.low_score",
        severity: "warning",
        payload: {
          avgRating: Math.round(avgRating * 10) / 10,
          threshold: feedbackThreshold,
          ratingsCount: feedbackStats._count.rating,
          windowDays: 28,
        },
      });
    }

    if (deliveryRiskProjects.length > 0 && !recentlyEmitted.has("delivery.risk")) {
      alertsToCreate.push({
        type: "delivery.risk",
        severity: "critical",
        payload: {
          count: deliveryRiskProjects.length,
          projects: deliveryRiskProjects.map((project) => ({
            id: project.id,
            name: project.name,
            targetDeliveryDate: project.targetDeliveryDate,
          })),
          windowDays: 7,
        },
      });
    }

    const created = [];
    for (const alert of alertsToCreate) {
      const createdAlert = await this.prisma.alertEvent.create({
        data: {
          workspaceId,
          type: alert.type,
          severity: alert.severity,
          payload: alert.payload as Prisma.InputJsonValue,
        },
      });
      await this.prisma.auditEvent.create({
        data: {
          workspaceId,
          actorUserId: "system",
          action: "alert.created",
          entityType: "alert",
          entityId: createdAlert.id,
          metadata: { type: alert.type, severity: alert.severity },
        },
      });
      created.push(createdAlert);
    }

    return { created: created.length, alerts: created };
  }

  async sendOverdueReminders(workspaceId: string) {
    const now = new Date();
    const overdueTasks = await this.prisma.task.findMany({
      where: {
        project: { workspaceId },
        status: { not: "done" },
        dueDate: { lt: now },
      },
      select: { id: true, title: true, assigneeUserId: true, projectId: true },
    });
    const reminders = overdueTasks
      .filter((task) => task.assigneeUserId)
      .map((task) => ({
        userId: task.assigneeUserId as string,
        type: "task.overdue",
        payload: { taskId: task.id, title: task.title, projectId: task.projectId },
      }));
    if (reminders.length) {
      await this.prisma.notification.createMany({ data: reminders });
    }
    return { sent: reminders.length };
  }

  async getOverdueTasks({
    workspaceId,
    assigneeUserId,
    query,
  }: {
    workspaceId: string;
    assigneeUserId?: string;
    query?: string;
  }) {
    const now = new Date();
    return this.prisma.task.findMany({
      where: {
        project: { workspaceId },
        status: { not: "done" },
        dueDate: { lt: now },
        assigneeUserId: assigneeUserId || undefined,
        ...(query
          ? {
              title: { contains: query, mode: "insensitive" },
            }
          : {}),
      },
      select: { id: true, title: true, assigneeUserId: true, dueDate: true, projectId: true },
      orderBy: { dueDate: "asc" },
    });
  }

  async getBlockedTasks({
    workspaceId,
    query,
  }: {
    workspaceId: string;
    query?: string;
  }) {
    return this.prisma.task.findMany({
      where: {
        project: { workspaceId },
        status: "blocked",
        ...(query
          ? {
              OR: [
                { title: { contains: query, mode: "insensitive" } },
                { blockedReason: { contains: query, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        title: true,
        blockedReason: true,
        blockedByTaskId: true,
        dueDate: true,
        projectId: true,
        assigneeUserId: true,
      },
      orderBy: { dueDate: "asc" },
    });
  }

  async runRetention(workspaceId: string) {
    await this.queueService.addRetentionArchive(workspaceId);
    await this.prisma.auditEvent.create({
      data: {
        workspaceId,
        actorUserId: "system",
        action: "retention.queued",
        entityType: "workspace",
        entityId: workspaceId,
        metadata: { job: "retention.archive" },
      },
    });
    return { queued: true, workspaceId };
  }

  async refreshDashboard(workspaceId: string, studyId?: string) {
    await this.prisma.auditEvent.create({
      data: {
        workspaceId,
        actorUserId: "system",
        action: "dashboard.refreshed",
        entityType: "workspace",
        entityId: workspaceId,
        metadata: { studyId: studyId ?? null },
      },
    });
    return { refreshed: true };
  }
}
