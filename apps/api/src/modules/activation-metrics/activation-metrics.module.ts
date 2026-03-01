import { Module } from "@nestjs/common";
import { ActivationMetricsController } from "./activation-metrics.controller";
import { ActivationMetricsService } from "./activation-metrics.service";
import { PrismaService } from "../../prisma/prisma.service";

@Module({
  controllers: [ActivationMetricsController],
  providers: [ActivationMetricsService, PrismaService],
})
export class ActivationMetricsModule {}
