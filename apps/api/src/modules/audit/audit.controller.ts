import { Controller, Get, Post, Query, Res } from "@nestjs/common";
import { Response } from "express";
import { AuditService } from "./audit.service";

@Controller("audit")
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  list(
    @Query("workspaceId") workspaceId: string,
    @Query("entityType") entityType?: string,
    @Query("entityId") entityId?: string,
    @Query("limit") limit?: string,
  ) {
    return this.auditService.list({
      workspaceId,
      entityType,
      entityId,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get("export.csv")
  async exportCsv(
    @Query("workspaceId") workspaceId: string,
    @Query("entityType") entityType: string | undefined,
    @Query("entityId") entityId: string | undefined,
    @Query("limit") limit: string | undefined,
    @Res() res: Response,
  ) {
    const csv = await this.auditService.exportCsv({
      workspaceId,
      entityType,
      entityId,
      limit: limit ? Number(limit) : undefined,
    });
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=audit-export.csv");
    res.send(csv);
  }

  @Post("retention-run")
  applyRetention(
    @Query("workspaceId") workspaceId: string,
    @Query("retentionDays") retentionDays?: string,
  ) {
    return this.auditService.applyRetention(
      workspaceId,
      retentionDays ? Number(retentionDays) : undefined,
    );
  }
}
