import { Controller, Get, Post, Query, Res } from "@nestjs/common";
import { Roles } from "../../auth/roles.decorator";
import { OpsService } from "./ops.service";
import type { Response } from "express";

@Controller("ops")
export class OpsController {
  constructor(private readonly opsService: OpsService) {}

  @Get("dashboard")
  @Roles("admin")
  getDashboard(@Query("workspaceId") workspaceId: string) {
    return this.opsService.getDashboard(workspaceId);
  }

  @Post("overdue-reminders")
  @Roles("admin")
  sendOverdueReminders(@Query("workspaceId") workspaceId: string) {
    return this.opsService.sendOverdueReminders(workspaceId);
  }

  @Get("overdue")
  @Roles("admin")
  listOverdue(
    @Query("workspaceId") workspaceId: string,
    @Query("assigneeUserId") assigneeUserId?: string,
    @Query("q") query?: string,
  ) {
    return this.opsService.getOverdueTasks({ workspaceId, assigneeUserId, query });
  }

  @Get("overdue.csv")
  @Roles("admin")
  async exportOverdue(
    @Query("workspaceId") workspaceId: string,
    @Query("assigneeUserId") assigneeUserId: string | undefined,
    @Query("q") query: string | undefined,
    @Res() res: Response,
  ) {
    const tasks = await this.opsService.getOverdueTasks({ workspaceId, assigneeUserId, query });
    const rows = [
      ["id", "title", "assigneeUserId", "dueDate", "projectId"],
      ...tasks.map((task) => [
        task.id,
        task.title.replaceAll('"', '""'),
        task.assigneeUserId ?? "",
        new Date(task.dueDate).toISOString(),
        task.projectId,
      ]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${value}"`).join(",")).join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=overdue-tasks.csv");
    res.send(csv);
  }

  @Get("blocked")
  @Roles("admin")
  listBlocked(
    @Query("workspaceId") workspaceId: string,
    @Query("q") query?: string,
  ) {
    return this.opsService.getBlockedTasks({ workspaceId, query });
  }

  @Get("blocked.csv")
  @Roles("admin")
  async exportBlocked(
    @Query("workspaceId") workspaceId: string,
    @Query("q") query: string | undefined,
    @Res() res: Response,
  ) {
    const tasks = await this.opsService.getBlockedTasks({ workspaceId, query });
    const rows = [
      ["id", "title", "blockedReason", "blockedByTaskId", "dueDate", "projectId", "assigneeUserId"],
      ...tasks.map((task) => [
        task.id,
        task.title.replaceAll('"', '""'),
        (task.blockedReason ?? "").replaceAll('"', '""'),
        task.blockedByTaskId ?? "",
        new Date(task.dueDate).toISOString(),
        task.projectId,
        task.assigneeUserId ?? "",
      ]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${value}"`).join(",")).join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=blocked-tasks.csv");
    res.send(csv);
  }

  @Post("retention-run")
  @Roles("admin")
  runRetention(@Query("workspaceId") workspaceId: string) {
    return this.opsService.runRetention(workspaceId);
  }

  @Post("dashboard/refresh")
  @Roles("admin")
  refreshDashboard(
    @Query("workspaceId") workspaceId: string,
    @Query("studyId") studyId?: string,
  ) {
    return this.opsService.refreshDashboard(workspaceId, studyId);
  }
}
