import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { AlertsService } from "./alerts.service";
import { CreateAlertInput } from "./alerts.dto";

@Controller("alerts")
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  list(@Query("workspaceId") workspaceId: string) {
    return this.alertsService.list(workspaceId);
  }

  @Post()
  create(@Body() input: CreateAlertInput) {
    return this.alertsService.create(input);
  }
}
