import { Body, Controller, Post } from "@nestjs/common";
import { Roles } from "../../auth/roles.decorator";
import { AuthTokensService } from "./auth-tokens.service";
import { RevokeTokenInput } from "./auth-tokens.dto";

@Controller("auth/tokens")
export class AuthTokensController {
  constructor(private readonly authTokensService: AuthTokensService) {}

  @Post("revoke")
  @Roles("admin")
  revoke(@Body() body: RevokeTokenInput) {
    return this.authTokensService.revoke(body);
  }

  @Post("purge")
  @Roles("admin")
  purge() {
    return this.authTokensService.purgeExpired();
  }
}
