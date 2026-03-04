import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Req } from "@nestjs/common";
import { WorkspacesService } from "./workspaces.service";
import { CreateWorkspaceInput, UpdateWorkspaceSettingsInput } from "./workspaces.dto";
import { Roles } from "../../auth/roles.decorator";
import { Public } from "../../auth/public.decorator";
import type { Request } from "express";
import type { JwtPayload } from "../../auth/auth.guard";

@Controller("workspaces")
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  /**
   * Create a new workspace.
   * @Public so first-time users (no workspaceId in token yet) can call it.
   */
  @Post()
  @Public()
  create(@Body() input: CreateWorkspaceInput, @Req() req: Request) {
    const user = (req as Request & { user?: JwtPayload }).user;
    return this.workspacesService.create(input, user?.sub, user?.email);
  }

  @Get(":id")
  @Roles("admin", "researcher")
  get(@Param("id") id: string) {
    return this.workspacesService.get(id);
  }

  @Patch(":id/settings")
  @Roles("admin")
  updateSettings(@Param("id") id: string, @Body() input: UpdateWorkspaceSettingsInput) {
    return this.workspacesService.updateSettings(id, input);
  }

  @Get(":id/invitations")
  @Roles("admin")
  listInvitations(@Param("id") id: string) {
    return this.workspacesService.listInvitations(id);
  }

  @Post(":id/invitations")
  @Roles("admin")
  invite(
    @Param("id") workspaceId: string,
    @Body() body: { email: string; role?: string },
    @Req() req: Request,
  ) {
    const actor = (req as Request & { user?: JwtPayload }).user;
    return this.workspacesService.createInvitation(
      workspaceId,
      body.email,
      body.role ?? "researcher",
      actor?.sub ?? "system",
    );
  }

  @Delete(":id/invitations/:inviteId")
  @Roles("admin")
  revokeInvitation(@Param("id") id: string, @Param("inviteId") inviteId: string) {
    return this.workspacesService.revokeInvitation(id, inviteId);
  }

  /** Preview invitation details without requiring auth (for the accept page). */
  @Get("invitations/:token/preview")
  @Public()
  previewInvitation(@Param("token") token: string) {
    return this.workspacesService.previewInvitation(token);
  }

  @Post("invitations/:token/accept")
  @Public()
  acceptInvitation(@Param("token") token: string, @Req() req: Request) {
    const user = (req as Request & { user?: JwtPayload }).user;
    return this.workspacesService.acceptInvitation(token, user?.sub, user?.email);
  }

  @Get(":id/usage")
  @Roles("admin")
  getUsage(@Param("id") id: string) {
    return this.workspacesService.getUsage(id);
  }

  @Get(":id/sso-config")
  @Roles("admin")
  getSsoConfig(@Param("id") id: string) {
    return this.workspacesService.getSsoConfig(id);
  }

  @Put(":id/sso-config")
  @Roles("admin")
  saveSsoConfig(@Param("id") id: string, @Body() body: Record<string, unknown>, @Req() req: Request) {
    const actor = (req as Request & { user?: JwtPayload }).user;
    return this.workspacesService.saveSsoConfig(id, body, actor?.sub ?? "system");
  }

  @Post(":id/sso-config/test")
  @Roles("admin")
  testSsoConfig(@Param("id") id: string) {
    return this.workspacesService.testSsoConfig(id);
  }
}
