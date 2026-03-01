import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ProjectsService } from "./projects.service";
import { CreateProjectInput, UpdateShareChecklistInput } from "./projects.dto";

@Controller("projects")
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  list(
    @Query("workspaceId") workspaceId: string,
    @Query("status") status?: string,
    @Query("ownerUserId") ownerUserId?: string,
    @Query("q") query?: string,
  ) {
    return this.projectsService.list({ workspaceId, status, ownerUserId, query });
  }

  @Get(":id/client-view")
  getClientView(@Param("id") id: string) {
    return this.projectsService.getClientView(id);
  }

  @Patch(":id/share-checklist")
  updateShareChecklist(@Param("id") id: string, @Body() body: UpdateShareChecklistInput) {
    return this.projectsService.updateShareChecklist(id, body);
  }

  @Get(":id/analysis-delivery")
  getAnalysisDelivery(@Param("id") id: string) {
    return this.projectsService.getAnalysisDelivery(id);
  }

  @Get(":id")
  getById(@Param("id") id: string) {
    return this.projectsService.getById(id);
  }

  @Post()
  create(@Body() input: CreateProjectInput) {
    return this.projectsService.create(input);
  }
}
