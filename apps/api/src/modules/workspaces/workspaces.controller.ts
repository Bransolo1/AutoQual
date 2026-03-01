import { Body, Controller, Get, Param, Patch } from "@nestjs/common";
import { WorkspacesService } from "./workspaces.service";
import { UpdateWorkspaceSettingsInput } from "./workspaces.dto";
import { Roles } from "../../auth/roles.decorator";

@Controller("workspaces")
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get(":id")
  @Roles("admin")
  get(@Param("id") id: string) {
    return this.workspacesService.get(id);
  }

  @Patch(":id/settings")
  @Roles("admin")
  updateSettings(@Param("id") id: string, @Body() input: UpdateWorkspaceSettingsInput) {
    return this.workspacesService.updateSettings(id, input);
  }
}
