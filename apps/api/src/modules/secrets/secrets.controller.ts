import { Controller, Get } from "@nestjs/common";
import { SecretsService } from "./secrets.service";
import { Roles } from "../../auth/roles.decorator";

@Controller("secrets")
export class SecretsController {
  constructor(private readonly secretsService: SecretsService) {}

  @Get("health")
  @Roles("admin")
  health() {
    return this.secretsService.health();
  }
}
