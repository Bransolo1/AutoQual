import { Controller, Get, Query } from "@nestjs/common";
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
}
