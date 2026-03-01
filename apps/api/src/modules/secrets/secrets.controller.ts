import { Controller, Get } from "@nestjs/common";
import { SecretsService } from "./secrets.service";

@Controller("secrets")
export class SecretsController {
  constructor(private readonly secretsService: SecretsService) {}

  @Get("health")
  health() {
    return this.secretsService.health();
  }
}
