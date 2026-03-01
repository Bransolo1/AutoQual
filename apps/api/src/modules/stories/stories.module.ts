import { Module } from "@nestjs/common";
import { StoriesController } from "./stories.controller";
import { StoriesService } from "./stories.service";
import { PrismaService } from "../../prisma/prisma.service";

@Module({
  controllers: [StoriesController],
  providers: [StoriesService, PrismaService],
})
export class StoriesModule {}
