import { Module } from "@nestjs/common";
import { AccessReviewsController } from "./access-reviews.controller";
import { AccessReviewsService } from "./access-reviews.service";
import { PrismaService } from "../../prisma/prisma.service";

@Module({
  controllers: [AccessReviewsController],
  providers: [AccessReviewsService, PrismaService],
})
export class AccessReviewsModule {}
