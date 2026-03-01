import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateActivationMetricInput } from "./activation-metrics.dto";

@Injectable()
export class ActivationMetricsService {
  constructor(private readonly prisma: PrismaService) {}

  list(projectId: string) {
    return this.prisma.activationMetric.findMany({
      where: { projectId },
      orderBy: { updatedAt: "desc" },
    });
  }

  async create(input: CreateActivationMetricInput) {
    const metric = await this.prisma.activationMetric.create({
      data: {
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        studyId: input.studyId,
        deliverableType: input.deliverableType,
        deliverableId: input.deliverableId,
        views: input.views ?? 0,
        shares: input.shares ?? 0,
        decisionsLogged: input.decisionsLogged ?? 0,
      },
    });
    await this.prisma.auditEvent.create({
      data: {
        workspaceId: input.workspaceId,
        actorUserId: "system",
        action: "activation_metric.created",
        entityType: "activation_metric",
        entityId: metric.id,
        metadata: {
          projectId: input.projectId,
          deliverableType: input.deliverableType,
          deliverableId: input.deliverableId ?? null,
        },
      },
    });
    return metric;
  }
}
