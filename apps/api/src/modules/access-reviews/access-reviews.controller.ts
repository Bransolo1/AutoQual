import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { Roles } from "../../auth/roles.decorator";
import { AccessReviewsService } from "./access-reviews.service";
import { CreateAccessReviewInput } from "./access-reviews.dto";

@Controller("access-reviews")
export class AccessReviewsController {
  constructor(private readonly accessReviewsService: AccessReviewsService) {}

  @Get()
  @Roles("admin")
  list(@Query("workspaceId") workspaceId: string, @Query("limit") limit?: string) {
    return this.accessReviewsService.list(workspaceId, limit ? Number(limit) : undefined);
  }

  @Post()
  @Roles("admin")
  create(@Body() input: CreateAccessReviewInput) {
    return this.accessReviewsService.create({
      ...input,
      reviewedUserIds: input.reviewedUserIds ?? [],
    });
  }
}
