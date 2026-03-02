import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { Roles } from "../../auth/roles.decorator";
import { UsersService } from "./users.service";
import { UpdateUserRolesInput } from "./users.dto";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles("admin")
  list(@Query("workspaceId") workspaceId: string) {
    return this.usersService.list(workspaceId);
  }

  @Post(":id/roles")
  @Roles("admin")
  updateRoles(@Param("id") id: string, @Body() input: UpdateUserRolesInput) {
    return this.usersService.updateRoles(id, input.roles ?? []);
  }
}
