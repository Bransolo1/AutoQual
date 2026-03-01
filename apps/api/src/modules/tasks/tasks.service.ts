import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateTaskInput, UpdateTaskInput, UpdateTaskStatusInput } from "./tasks.dto";
import { resolveDependencyOrder } from "./task-dependency";

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async list(projectId: string) {
    return this.prisma.task.findMany({ where: { projectId }, include: { comments: true } });
  }

  async getDependencyOrder(projectId: string) {
    const tasks = await this.prisma.task.findMany({
      where: { projectId },
      select: { id: true, title: true, status: true, blockedReason: true, blockedByTaskId: true, dependencies: true },
    });
    const order = resolveDependencyOrder(tasks.map((task) => ({ id: task.id, dependencies: task.dependencies })));
    const byId = new Map(tasks.map((task) => [task.id, task]));
    return order.map((id) => byId.get(id)).filter(Boolean);
  }

  async getById(id: string) {
    return this.prisma.task.findUniqueOrThrow({
      where: { id },
      include: { comments: true, milestone: true },
    });
  }

  async addComment(taskId: string, authorUserId: string, body: string) {
    const comment = await this.prisma.taskComment.create({
      data: { taskId, authorUserId, body },
    });
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { assigneeUserId: true, reviewerUserId: true, title: true, projectId: true, project: true },
    });
    if (task?.project?.workspaceId) {
      await this.prisma.auditEvent.create({
        data: {
          workspaceId: task.project.workspaceId,
          actorUserId: authorUserId,
          action: "task.comment.added",
          entityType: "task",
          entityId: taskId,
          metadata: { body },
        },
      });
    }
    const recipients = new Set<string>();
    if (task?.assigneeUserId) recipients.add(task.assigneeUserId);
    if (task?.reviewerUserId) recipients.add(task.reviewerUserId);
    recipients.delete(authorUserId);
    if (recipients.size) {
      await this.prisma.notification.createMany({
        data: Array.from(recipients).map((userId) => ({
          userId,
          type: "task.comment",
          payload: { taskId, title: task?.title, projectId: task?.projectId },
        })),
      });
    }
    return comment;
  }

  async create(input: CreateTaskInput & { workspaceId?: string; actorUserId?: string }) {
    const task = await this.prisma.task.create({
      data: {
        projectId: input.projectId,
        milestoneId: input.milestoneId ?? null,
        title: input.title,
        description: input.description,
        status: input.status,
        priority: input.priority,
        assigneeUserId: input.assigneeUserId ?? null,
        reviewerUserId: input.reviewerUserId ?? null,
        dueDate: new Date(input.dueDate),
        dependencies: input.dependencies,
      },
    });

    if (input.workspaceId && input.actorUserId) {
      await this.prisma.auditEvent.create({
        data: {
          workspaceId: input.workspaceId,
          actorUserId: input.actorUserId,
          action: "task.created",
          entityType: "task",
          entityId: task.id,
          metadata: {
            title: task.title,
            status: task.status,
            priority: task.priority,
            assigneeUserId: task.assigneeUserId,
            reviewerUserId: task.reviewerUserId,
          },
        },
      });
    }

    const notifications = [];
    if (task.assigneeUserId) {
      notifications.push({
        userId: task.assigneeUserId,
        type: "task.assigned",
        payload: { taskId: task.id, title: task.title, projectId: task.projectId },
      });
    }
    if (task.reviewerUserId) {
      notifications.push({
        userId: task.reviewerUserId,
        type: "task.reviewer.assigned",
        payload: { taskId: task.id, title: task.title, projectId: task.projectId },
      });
    }
    if (notifications.length) {
      await this.prisma.notification.createMany({ data: notifications });
    }

    return task;
  }

  async update(taskId: string, input: UpdateTaskInput) {
    const existing = await this.prisma.task.findUniqueOrThrow({ where: { id: taskId } });
    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        title: input.title ?? undefined,
        description: input.description ?? undefined,
        priority: input.priority ?? undefined,
        assigneeUserId: input.assigneeUserId ?? undefined,
        reviewerUserId: input.reviewerUserId ?? undefined,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        dependencies: input.dependencies ?? undefined,
      },
    });

    if (
      (input.assigneeUserId !== undefined ||
        input.reviewerUserId !== undefined ||
        input.priority !== undefined ||
        input.dueDate !== undefined) &&
      input.workspaceId &&
      input.actorUserId
    ) {
      await this.prisma.auditEvent.create({
        data: {
          workspaceId: input.workspaceId,
          actorUserId: input.actorUserId,
          action: "task.updated",
          entityType: "task",
          entityId: updated.id,
          metadata: {
            assigneeUserId: input.assigneeUserId ?? null,
            reviewerUserId: input.reviewerUserId ?? null,
            priority: input.priority ?? null,
            dueDate: input.dueDate ?? null,
          },
        },
      });
    }

    const notifications = [];
    if (input.assigneeUserId !== undefined && input.assigneeUserId !== existing.assigneeUserId) {
      if (input.assigneeUserId) {
        notifications.push({
          userId: input.assigneeUserId,
          type: "task.assigned",
          payload: { taskId: updated.id, title: updated.title, projectId: updated.projectId },
        });
      }
    }
    if (input.reviewerUserId !== undefined && input.reviewerUserId !== existing.reviewerUserId) {
      if (input.reviewerUserId) {
        notifications.push({
          userId: input.reviewerUserId,
          type: "task.reviewer.assigned",
          payload: { taskId: updated.id, title: updated.title, projectId: updated.projectId },
        });
      }
    }
    if (notifications.length) {
      await this.prisma.notification.createMany({ data: notifications });
    }

    return updated;
  }

  async updateStatus(taskId: string, input: UpdateTaskStatusInput) {
    if (input.status === "blocked" && !input.blockedReason) {
      throw new BadRequestException("blocked_reason_required");
    }
    if (input.status === "done") {
      const task = await this.prisma.task.findUniqueOrThrow({
        where: { id: taskId },
        select: { dependencies: true },
      });
      if (task.dependencies.length) {
        const deps = await this.prisma.task.findMany({
          where: { id: { in: task.dependencies } },
          select: { id: true, status: true },
        });
        const incomplete = deps.filter((dep) => dep.status !== "done");
        if (incomplete.length) {
          throw new BadRequestException("dependencies_incomplete");
        }
      }
    }
    const task = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: input.status,
        blockedReason: input.status === "blocked" ? input.blockedReason ?? null : null,
        blockedByTaskId: input.status === "blocked" ? input.blockedByTaskId ?? null : null,
      },
    });

    await this.prisma.auditEvent.create({
      data: {
        workspaceId: input.workspaceId,
        actorUserId: input.actorUserId,
        action: "task.status.updated",
        entityType: "task",
        entityId: taskId,
        metadata: {
          status: input.status,
          blockedReason: input.blockedReason ?? null,
          blockedByTaskId: input.blockedByTaskId ?? null,
        }
      }
    });

    return task;
  }

  async share(taskId: string, input: { workspaceId: string; actorUserId: string; channel?: string; context?: string }) {
    await this.prisma.auditEvent.create({
      data: {
        workspaceId: input.workspaceId,
        actorUserId: input.actorUserId,
        action: "task.shared",
        entityType: "task",
        entityId: taskId,
        metadata: {
          channel: input.channel ?? "link",
          context: input.context ?? null,
        },
      },
    });
    return { ok: true };
  }
}
