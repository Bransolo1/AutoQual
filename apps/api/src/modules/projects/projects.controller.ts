import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { Roles } from "../../auth/roles.decorator";
import { ProjectsService } from "./projects.service";
import { CreateProjectInput, UpdateShareChecklistInput } from "./projects.dto";

@Controller("projects")
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @Roles("admin", "researcher", "reviewer")
  list(
    @Query("workspaceId") workspaceId: string,
    @Query("status") status?: string,
    @Query("ownerUserId") ownerUserId?: string,
    @Query("q") query?: string,
  ) {
    return this.projectsService.list({ workspaceId, status, ownerUserId, query });
  }

  @Get(":id/client-view")
  @Roles("admin", "researcher", "reviewer", "client")
  getClientView(@Param("id") id: string) {
    return this.projectsService.getClientView(id);
  }

  @Patch(":id/share-checklist")
  @Roles("admin", "researcher", "reviewer")
  updateShareChecklist(@Param("id") id: string, @Body() body: UpdateShareChecklistInput) {
    return this.projectsService.updateShareChecklist(id, body);
  }

  @Get(":id/analysis-delivery")
  @Roles("admin", "researcher", "reviewer", "client")
  getAnalysisDelivery(@Param("id") id: string) {
    return this.projectsService.getAnalysisDelivery(id);
  }

  @Get(":id")
  @Roles("admin", "researcher", "reviewer")
  getById(@Param("id") id: string) {
    return this.projectsService.getById(id);
  }

  @Post()
  @Roles("admin", "researcher")
  create(@Body() input: CreateProjectInput) {
    return this.projectsService.create(input);
  }
}
