import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { WorkspacesModule } from "../workspaces/workspaces.module";

@Module({
  imports: [WorkspacesModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
