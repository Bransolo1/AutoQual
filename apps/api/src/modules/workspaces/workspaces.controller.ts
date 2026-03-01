import { Body, Controller, Get, Param, Patch } from "@nestjs/common";
import { WorkspacesService } from "./workspaces.service";
import { UpdateWorkspaceSettingsInput } from "./workspaces.dto";

@Controller("workspaces")
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get(":id")
  get(@Param("id") id: string) {
    return this.workspacesService.get(id);
  }

  @Patch(":id/settings")
  updateSettings(@Param("id") id: string, @Body() input: UpdateWorkspaceSettingsInput) {
    return this.workspacesService.updateSettings(id, input);
  }
}
