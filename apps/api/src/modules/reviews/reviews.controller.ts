import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ReviewsService } from "./reviews.service";
import {
  AddReviewCommentInput,
  AssignReviewerInput,
  CreateReviewInput,
  UpdateReviewStatusInput
} from "./reviews.dto";

@Controller("reviews")
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  list(@Query("insightId") insightId: string) {
    return this.reviewsService.list(insightId);
  }

  @Get(":id")
  getById(@Param("id") id: string) {
    return this.reviewsService.getById(id);
  }

  @Post()
  create(@Body() input: CreateReviewInput) {
    return this.reviewsService.create(input);
  }

  @Patch(":id/status")
  updateStatus(@Param("id") id: string, @Body() input: UpdateReviewStatusInput) {
    return this.reviewsService.updateStatus(id, input);
  }

  @Post(":id/comments")
  addComment(@Param("id") id: string, @Body() input: AddReviewCommentInput) {
    return this.reviewsService.addComment(id, input);
  }

  @Patch(":id/assign")
  assignReviewer(@Param("id") id: string, @Body() input: AssignReviewerInput) {
    if (!input.reviewerId || input.actorUserId === input.reviewerId) {
      throw new BadRequestException("Invalid reviewer assignment");
    }
    return this.reviewsService.assignReviewer(id, input);
  }
}
