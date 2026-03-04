import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { QueueService } from "../../queue/queue.service";
import { UpdateWorkspaceSettingsInput } from "./workspaces.dto";
import { EmailService, invitationEmail, welcomeEmail } from "@sensehub/email";

@Injectable()
export class WorkspacesService {
  private readonly email = new EmailService();

  constructor(private readonly prisma: PrismaService, private readonly queueService: QueueService) {}

  async get(workspaceId: string) {
    return this.prisma.workspace.findUniqueOrThrow({ where: { id: workspaceId } });
  }

  async updateSettings(workspaceId: string, input: UpdateWorkspaceSettingsInput) {
    const updated = await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        retentionDays: input.retentionDays ?? undefined,
        auditRetentionEnabled: input.auditRetentionEnabled ?? undefined,
        auditRetentionDays: input.auditRetentionDays ?? undefined,
        piiRedactionEnabled: input.piiRedactionEnabled ?? undefined,
        encryptionAtRest: input.encryptionAtRest ?? undefined,
        integrations: input.integrations ?? undefined,
        servicesNotes: input.servicesNotes ?? undefined,
        activationViewThreshold: input.activationViewThreshold ?? undefined,
        feedbackScoreThreshold: input.feedbackScoreThreshold ?? undefined,
      },
    });
    if (input.auditRetentionEnabled === true) {
      await this.queueService.addAuditRetentionSchedule(workspaceId);
    }
    if (input.auditRetentionEnabled === false) {
      try {
        await this.queueService.removeAuditRetentionSchedule(workspaceId);
      } catch (error) {
        console.warn("Failed to remove audit retention schedule", error);
      }
    }
    await this.prisma.auditEvent.create({
      data: {
        workspaceId,
        actorUserId: "system",
        action: "workspace.settings.updated",
        entityType: "workspace",
        entityId: workspaceId,
        metadata: {
          retentionDays: input.retentionDays ?? null,
          auditRetentionEnabled: input.auditRetentionEnabled ?? null,
          auditRetentionDays: input.auditRetentionDays ?? null,
          piiRedactionEnabled: input.piiRedactionEnabled ?? null,
          encryptionAtRest: input.encryptionAtRest ?? null,
          integrations: input.integrations ?? null,
          servicesNotes: input.servicesNotes ?? null,
          activationViewThreshold: input.activationViewThreshold ?? null,
          feedbackScoreThreshold: input.feedbackScoreThreshold ?? null,
        },
      },
    });
    return updated;
  }

  async create(input: { name: string; slug?: string }, ownerSub?: string, ownerEmail?: string) {
    const slug = input.slug
      ? input.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-")
      : input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14-day trial

    const workspace = await this.prisma.$transaction(async (tx) => {
      const ws = await tx.workspace.create({
        data: { name: input.name, slug, billingStatus: "trialing", trialEndsAt },
      });

      // Provision the creator as admin if we have their identity
      if (ownerEmail) {
        const user = await tx.user.upsert({
          where: { email: ownerEmail },
          create: { email: ownerEmail, name: ownerEmail.split("@")[0], workspaceId: ws.id },
          update: {},
        });
        await tx.roleAssignment.upsert({
          where: { id: `${user.id}-admin` },
          create: { id: `${user.id}-admin`, userId: user.id, role: "admin" },
          update: {},
        }).catch(async () => {
          const existing = await tx.roleAssignment.findFirst({ where: { userId: user.id, role: "admin" } });
          if (!existing) await tx.roleAssignment.create({ data: { userId: user.id, role: "admin" } });
        });
      }

      await tx.auditEvent.create({
        data: {
          workspaceId: ws.id,
          actorUserId: ownerSub ?? "system",
          action: "workspace.created",
          entityType: "workspace",
          entityId: ws.id,
          metadata: { name: input.name, slug },
        },
      });

      return ws;
    });

    // Fire welcome email (best-effort, non-blocking)
    if (ownerEmail) {
      const appUrl = process.env.APP_URL ?? "https://sensehub.app";
      const { subject, html, text } = welcomeEmail({
        workspaceName: input.name,
        dashboardUrl: `${appUrl}/`,
      });
      void this.email.send({ to: ownerEmail, subject, html, text });
    }

    return workspace;
  }

  async listInvitations(workspaceId: string) {
    return this.prisma.workspaceInvitation.findMany({
      where: { workspaceId, status: "pending", expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });
  }

  async createInvitation(workspaceId: string, email: string, role: string, invitedByUserId: string) {
    const { randomBytes } = await import("crypto");
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const invitation = await this.prisma.workspaceInvitation.create({
      data: { workspaceId, email, role, token, expiresAt, invitedByUserId, status: "pending" },
    });

    await this.prisma.auditEvent.create({
      data: {
        workspaceId,
        actorUserId: invitedByUserId,
        action: "workspace.invitation.created",
        entityType: "workspace_invitation",
        entityId: invitation.id,
        metadata: { email, role },
      },
    });

    // Send invitation email (best-effort)
    const workspace = await this.prisma.workspace.findUnique({ where: { id: workspaceId }, select: { name: true } });
    if (workspace) {
      const appUrl = process.env.APP_URL ?? "https://sensehub.app";
      const { subject, html, text } = invitationEmail({
        workspaceName: workspace.name,
        role,
        acceptUrl: `${appUrl}/invite/${token}`,
        expiresAt,
      });
      void this.email.send({ to: email, subject, html, text });
    }

    return invitation;
  }

  async previewInvitation(token: string) {
    const invitation = await this.prisma.workspaceInvitation.findUnique({
      where: { token },
      include: { workspace: { select: { name: true } } },
    });
    if (!invitation || invitation.status !== "pending" || invitation.expiresAt < new Date()) {
      return null;
    }
    return { email: invitation.email, role: invitation.role, workspaceName: invitation.workspace.name };
  }

  async revokeInvitation(workspaceId: string, inviteId: string) {
    return this.prisma.workspaceInvitation.updateMany({
      where: { id: inviteId, workspaceId },
      data: { status: "revoked" },
    });
  }

  async getUsage(workspaceId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [sessionsThisMonth, activeSeats] = await Promise.all([
      this.prisma.session.count({
        where: {
          study: { workspaceId },
          createdAt: { gte: startOfMonth },
        },
      }),
      this.prisma.user.count({ where: { workspaceId } }),
    ]);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentSessions = await this.prisma.session.findMany({
      where: { study: { workspaceId }, createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
    });

    const dailyMap: Record<string, number> = {};
    for (const s of recentSessions) {
      const dateKey = s.createdAt.toISOString().slice(0, 10);
      dailyMap[dateKey] = (dailyMap[dateKey] ?? 0) + 1;
    }
    const dailySessions = Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    return { sessionsThisMonth, storageBytes: 0, activeSeats, dailySessions };
  }

  async getSsoConfig(workspaceId: string) {
    const ws = await this.prisma.workspace.findUniqueOrThrow({
      where: { id: workspaceId },
      select: { ssoConfig: true },
    });
    const config = ws.ssoConfig as Record<string, unknown> | null;
    if (!config) return null;
    const { clientSecret: _stripped, ...safe } = config as { clientSecret?: unknown };
    return safe;
  }

  async saveSsoConfig(workspaceId: string, config: Record<string, unknown>, actorUserId: string) {
    await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: { ssoConfig: config },
    });
    await this.prisma.auditEvent.create({
      data: {
        workspaceId,
        actorUserId,
        action: "workspace.sso_config.updated",
        entityType: "workspace",
        entityId: workspaceId,
        metadata: { issuerUrl: config.issuerUrl ?? null, clientId: config.clientId ?? null },
      },
    });
    return { ok: true };
  }

  async testSsoConfig(workspaceId: string) {
    const ws = await this.prisma.workspace.findUniqueOrThrow({
      where: { id: workspaceId },
      select: { ssoConfig: true },
    });
    const config = ws.ssoConfig as { issuerUrl?: string } | null;
    if (!config?.issuerUrl) return { ok: false, error: "No issuer URL configured" };
    try {
      const url = `${config.issuerUrl.replace(/\/$/, "")}/.well-known/openid-configuration`;
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) return { ok: false, error: `OIDC discovery returned HTTP ${res.status}` };
      return { ok: true };
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  }

  async acceptInvitation(token: string, acceptorSub?: string, acceptorEmail?: string) {
    const invitation = await this.prisma.workspaceInvitation.findUnique({ where: { token } });
    if (!invitation) throw new Error("Invitation not found");
    if (invitation.status !== "pending") throw new Error("Invitation already used or revoked");
    if (invitation.expiresAt < new Date()) throw new Error("Invitation expired");

    const email = acceptorEmail ?? invitation.email;
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.upsert({
        where: { email },
        create: { email, name: email.split("@")[0], workspaceId: invitation.workspaceId },
        update: { workspaceId: invitation.workspaceId },
      });

      const existingRole = await tx.roleAssignment.findFirst({
        where: { userId: user.id, role: invitation.role },
      });
      if (!existingRole) {
        await tx.roleAssignment.create({ data: { userId: user.id, role: invitation.role } });
      }

      await tx.workspaceInvitation.update({
        where: { token },
        data: { status: "accepted", acceptedAt: new Date() },
      });

      return { workspaceId: invitation.workspaceId, userId: user.id, role: invitation.role };
    });
  }
}
