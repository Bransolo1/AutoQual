import { Body, Controller, Delete, Get, Param, Post, Query, Res } from "@nestjs/common";
import { Roles } from "../../auth/roles.decorator";
import { AlertsService } from "./alerts.service";
import { CreateAlertInput, CreateAlertViewInput } from "./alerts.dto";
import type { Response } from "express";

@Controller("alerts")
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  @Roles("admin")
  list(
    @Query("workspaceId") workspaceId: string,
    @Query("type") type?: string,
    @Query("severity") severity?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("limit") limit?: string,
  ) {
    return this.alertsService.list(workspaceId, {
      type,
      severity,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get("export.csv")
  @Roles("admin")
  async exportCsv(
    @Query("workspaceId") workspaceId: string,
    @Query("type") type: string | undefined,
    @Query("severity") severity: string | undefined,
    @Query("from") from: string | undefined,
    @Query("to") to: string | undefined,
    @Res() res: Response,
  ) {
    const alerts = await this.alertsService.list(workspaceId, {
      type,
      severity,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
    const rows: string[][] = [
      ["id", "type", "severity", "createdAt", "payload"],
      ...alerts.map((alert: { id: string; type: string; severity: string; createdAt: Date; payload: unknown }) => [
        alert.id,
        alert.type.replaceAll('"', '""'),
        alert.severity,
        new Date(alert.createdAt).toISOString(),
        JSON.stringify(alert.payload).replaceAll('"', '""'),
      ]),
    ];
    const csv = rows.map((row) => row.map((value: string) => `"${value}"`).join(",")).join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=alerts.csv");
    res.send(csv);
  }

  @Post()
  @Roles("admin")
  create(@Body() input: CreateAlertInput) {
    return this.alertsService.create(input);
  }

  @Get("views")
  @Roles("admin")
  listViews(@Query("workspaceId") workspaceId: string) {
    return this.alertsService.listViews(workspaceId);
  }

  @Post("views")
  @Roles("admin")
  createView(@Body() input: CreateAlertViewInput) {
    return this.alertsService.createView(input);
  }

  @Delete("views/:id")
  @Roles("admin")
  deleteView(@Param("id") id: string) {
    return this.alertsService.deleteView(id);
  }
}
