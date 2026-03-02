import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { SearchService } from "../search/search.service";

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly searchService: SearchService,
  ) {}

  async getStatus() {
    let db = "ok";
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      db = "error";
    }
    const search = await this.searchService.health();
    return {
      status: db === "ok" ? "ok" : "degraded",
      checks: { database: db },
      search,
      version: process.env.npm_package_version ?? "1.0.0",
    };
  }
}
