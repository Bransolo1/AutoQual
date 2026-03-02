import { describe, expect, it, vi } from "vitest";
import { TasksService } from "./tasks.service";

describe("TasksService.updateStatus", () => {
  it("creates an audit event when status changes", async () => {
    const prisma = {
      task: {
        findUniqueOrThrow: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn().mockResolvedValue({ id: "task-1" }),
      },
      auditEvent: {
        create: vi.fn().mockResolvedValue({ id: "audit-1" }),
      },
    } as any;
    const service = new TasksService(prisma);

    await service.updateStatus("task-1", {
      status: "in_progress",
      workspaceId: "workspace-1",
      actorUserId: "user-1",
    });

    expect(prisma.auditEvent.create).toHaveBeenCalledWith({
      data: {
        workspaceId: "workspace-1",
        actorUserId: "user-1",
        action: "task.status.updated",
        entityType: "task",
        entityId: "task-1",
        metadata: {
          status: "in_progress",
          blockedReason: null,
          blockedByTaskId: null,
        },
      },
    });
  });
});
