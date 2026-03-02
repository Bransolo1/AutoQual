import { Module } from "@nestjs/common";
import { SearchController } from "./search.controller";
import { SearchService } from "./search.service";
import { PrismaService } from "../../prisma/prisma.service";

@Module({
  controllers: [SearchController],
  providers: [SearchService, PrismaService],
  exports: [SearchService],
})
export class SearchModule {}
import { Module } from "@nestjs/common";
import { SearchController } from "./search.controller";
import { SearchService } from "./search.service";

@Module({
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
