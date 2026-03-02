import { Module } from "@nestjs/common";
import { SsoController } from "./sso.controller";
import { PrismaService } from "../../prisma/prisma.service";
import { SsoService } from "./sso.service";

@Module({
  controllers: [SsoController],
  providers: [SsoService, PrismaService],
})
export class SsoModule {}
