import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ActivationMetricsService } from "./activation-metrics.service";
import { CreateActivationMetricInput } from "./activation-metrics.dto";

@Controller("activation-metrics")
export class ActivationMetricsController {
  constructor(private readonly activationMetricsService: ActivationMetricsService) {}

  @Get()
  list(@Query("projectId") projectId: string) {
    return this.activationMetricsService.list(projectId);
  }

  @Post()
  create(@Body() input: CreateActivationMetricInput) {
    return this.activationMetricsService.create(input);
  }
}
