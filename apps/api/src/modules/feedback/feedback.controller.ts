import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { FeedbackService } from "./feedback.service";
import { CreateStakeholderFeedbackInput } from "./feedback.dto";

@Controller("feedback")
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Get()
  list(@Query("projectId") projectId: string) {
    return this.feedbackService.list(projectId);
  }

  @Post()
  create(@Body() input: CreateStakeholderFeedbackInput) {
    return this.feedbackService.create(input);
  }
}
