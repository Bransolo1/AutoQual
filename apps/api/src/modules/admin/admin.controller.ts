import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { Roles } from "../../auth/roles.decorator";

@Controller("admin")
@Roles("operator")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("workspaces")
  listWorkspaces(@Query("q") q?: string) {
    return this.adminService.listWorkspaces(q);
  }

  @Post("workspaces")
  provisionWorkspace(
    @Body() body: { name: string; slug?: string; ownerEmail?: string },
  ) {
    return this.adminService.provisionWorkspace(body.name, body.slug, body.ownerEmail);
  }

  @Post("workspaces/:id/suspend")
  suspendWorkspace(@Param("id") id: string) {
    return this.adminService.suspendWorkspace(id);
  }
}
