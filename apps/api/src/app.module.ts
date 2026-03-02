import { Module, NestModule, MiddlewareConsumer, OnModuleInit } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { LoggerMiddleware } from "./common/logger.middleware";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { HealthModule } from "./modules/health/health.module";
import { ProjectsModule } from "./modules/projects/projects.module";
import { MilestonesModule } from "./modules/milestones/milestones.module";
import { TasksModule } from "./modules/tasks/tasks.module";
import { ApprovalsModule } from "./modules/approvals/approvals.module";
import { AttachmentsModule } from "./modules/attachments/attachments.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { AuditModule } from "./modules/audit/audit.module";
import { StudiesModule } from "./modules/studies/studies.module";
import { SessionsModule } from "./modules/sessions/sessions.module";
import { TranscriptsModule } from "./modules/transcripts/transcripts.module";
import { ParticipantsModule } from "./modules/participants/participants.module";
import { ThemesModule } from "./modules/themes/themes.module";
import { InsightsModule } from "./modules/insights/insights.module";
import { ReviewsModule } from "./modules/reviews/reviews.module";
import { ExportsModule } from "./modules/exports/exports.module";
import { OpsModule } from "./modules/ops/ops.module";
import { MediaModule } from "./modules/media/media.module";
import { ModeratorModule } from "./modules/moderator/moderator.module";
import { EmbedModule } from "./modules/embed/embed.module";
import { SearchModule } from "./modules/search/search.module";
import { AiModule } from "./modules/ai/ai.module";
import { WorkspacesModule } from "./modules/workspaces/workspaces.module";
import { AnalysisModule } from "./modules/analysis/analysis.module";
import { StoriesModule } from "./modules/stories/stories.module";
import { TrustCenterModule } from "./modules/trust-center/trust-center.module";
import { FeedbackModule } from "./modules/feedback/feedback.module";
import { ActivationMetricsModule } from "./modules/activation-metrics/activation-metrics.module";
import { AlertsModule } from "./modules/alerts/alerts.module";
import { SsoModule } from "./modules/sso/sso.module";
import { SecretsModule } from "./modules/secrets/secrets.module";
import { AuthTokensModule } from "./modules/auth-tokens/auth-tokens.module";
import { UsersModule } from "./modules/users/users.module";
import { AccessReviewsModule } from "./modules/access-reviews/access-reviews.module";
import { PrismaModule } from "./prisma/prisma.module";
import { PrismaService } from "./prisma/prisma.service";
import { QueueModule } from "./queue/queue.module";
import { QueueService } from "./queue/queue.service";
import { APP_GUARD, Reflector } from "@nestjs/core";
import { AuthGuard } from "./auth/auth.guard";
import { WorkspaceGuard } from "./auth/workspace.guard";
import { RolesGuard } from "./auth/roles.guard";
import { envValidationSchema } from "./config/env.validation";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: false },
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: Number(process.env.THROTTLE_TTL ?? 60),
          limit: Number(process.env.THROTTLE_LIMIT ?? 120),
        },
      ],
    }),
    PrismaModule,
    QueueModule,
    HealthModule,
    ProjectsModule,
    MilestonesModule,
    TasksModule,
    ApprovalsModule,
    AttachmentsModule,
    NotificationsModule,
    AuditModule,
    StudiesModule,
    ParticipantsModule,
    SessionsModule,
    TranscriptsModule,
    ThemesModule,
    InsightsModule,
    ReviewsModule,
    ExportsModule,
    OpsModule,
    MediaModule,
    ModeratorModule,
    EmbedModule,
    SearchModule,
    AiModule,
    WorkspacesModule,
    AnalysisModule,
    StoriesModule,
    TrustCenterModule,
    FeedbackModule,
    ActivationMetricsModule,
    AlertsModule,
    SsoModule,
    SecretsModule,
    AuthTokensModule,
    UsersModule,
    AccessReviewsModule,
  ],
  providers: [
    Reflector,
    AuthGuard,
    WorkspaceGuard,
    RolesGuard,
    LoggerMiddleware,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ]
})
export class AppModule implements NestModule, OnModuleInit {
  constructor(
    private readonly queueService: QueueService,
    private readonly prisma: PrismaService,
  ) {}

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes("*");
  }

  async onModuleInit() {
    if (process.env.TOKEN_REVOCATION_PURGE_ENABLED === "true") {
      await this.queueService.addTokenRevocationPurge();
    }
    const workspaces = await this.prisma.workspace.findMany({
      where: { auditRetentionEnabled: true },
      select: { id: true },
    });
    await Promise.all(workspaces.map((workspace) => this.queueService.addAuditRetentionSchedule(workspace.id)));

    const allWorkspaces = await this.prisma.workspace.findMany({ select: { id: true } });
    await Promise.all(allWorkspaces.map((workspace) => this.queueService.addAlertsRefreshSchedule(workspace.id)));
  }
}
