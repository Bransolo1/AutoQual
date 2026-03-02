import { Module } from "@nestjs/common";
import { AuthTokensController } from "./auth-tokens.controller";
import { AuthTokensService } from "./auth-tokens.service";

@Module({
  controllers: [AuthTokensController],
  providers: [AuthTokensService],
  exports: [AuthTokensService],
})
export class AuthTokensModule {}
