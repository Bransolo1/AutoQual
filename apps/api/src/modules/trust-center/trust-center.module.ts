import { Module } from "@nestjs/common";
import { TrustCenterController } from "./trust-center.controller";
import { TrustCenterService } from "./trust-center.service";
import { PrismaService } from "../../prisma/prisma.service";

@Module({
  controllers: [TrustCenterController],
  providers: [TrustCenterService, PrismaService],
})
export class TrustCenterModule {}
