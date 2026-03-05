import { Module } from "@nestjs/common";
import { ActivationMetricsController } from "./activation-metrics.controller";
import { ActivationMetricsService } from "./activation-metrics.service";

@Module({
  controllers: [ActivationMetricsController],
  providers: [ActivationMetricsService],
})
export class ActivationMetricsModule {}
