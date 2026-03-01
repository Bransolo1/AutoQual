import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { MilestonesService } from "./milestones.service";
import { CreateMilestoneInput } from "./milestones.dto";

@Controller("milestones")
export class MilestonesController {
  constructor(private readonly milestonesService: MilestonesService) {}

  @Get()
  list(@Query("projectId") projectId: string) {
    return this.milestonesService.list(projectId);
  }

  @Post()
  create(@Body() input: CreateMilestoneInput) {
    return this.milestonesService.create(input);
  }
}
