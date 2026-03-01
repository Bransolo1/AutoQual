import { Controller, Get } from "@nestjs/common";
import { Public } from "../../auth/public.decorator";
import { PrismaService } from "../../prisma/prisma.service";

@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  async getHealth() {
    let db = "ok";
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      db = "error";
    }
    return {
      status: db === "ok" ? "ok" : "degraded",
      checks: { database: db },
      version: process.env.npm_package_version ?? "1.0.0",
    };
  }
}
