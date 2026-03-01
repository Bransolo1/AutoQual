import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApprovalsService } from "./approvals.service";
import { CreateApprovalInput, UpdateApprovalStatusInput } from "./approvals.dto";

@Controller("approvals")
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Get()
  list(
    @Query("linkedEntityId") linkedEntityId?: string,
    @Query("status") status?: string,
    @Query("linkedEntityType") linkedEntityType?: string,
    @Query("approvalId") approvalId?: string,
  ) {
    return this.approvalsService.list({ linkedEntityId, status, linkedEntityType, approvalId });
  }

  @Post()
  create(@Body() input: CreateApprovalInput) {
    return this.approvalsService.create(input);
  }

  @Patch(":id/status")
  updateStatus(@Param("id") id: string, @Body() input: UpdateApprovalStatusInput) {
    return this.approvalsService.updateStatus(id, input);
  }
}
