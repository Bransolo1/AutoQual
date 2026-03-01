import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import {
  AddReviewCommentInput,
  AssignReviewerInput,
  CreateReviewInput,
  UpdateReviewStatusInput
} from "./reviews.dto";

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(insightId: string) {
    return this.prisma.review.findMany({ where: { insightId }, include: { commentEntries: true } });
  }

  async getById(reviewId: string) {
    return this.prisma.review.findUniqueOrThrow({ where: { id: reviewId } });
  }

  async create(input: CreateReviewInput) {
    return this.prisma.review.create({
      data: {
        insightId: input.insightId,
        status: input.status,
        reviewerId: input.reviewerId ?? null,
        comments: input.comments ?? null
      }
    });
  }

  async updateStatus(reviewId: string, input: UpdateReviewStatusInput) {
    const review = await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        status: input.status,
        reviewerId: input.reviewerId ?? undefined
      }
    });

    await this.prisma.auditEvent.create({
      data: {
        workspaceId: input.workspaceId,
        actorUserId: input.actorUserId,
        action: "review.status.updated",
        entityType: "review",
        entityId: reviewId,
        metadata: { status: input.status, decisionNote: input.decisionNote ?? null }
      }
    });

    return review;
  }

  async addComment(reviewId: string, input: AddReviewCommentInput) {
    const comment = await this.prisma.reviewComment.create({
      data: {
        reviewId,
        authorUserId: input.authorUserId,
        body: input.body
      }
    });
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      select: { reviewerId: true, insightId: true, insight: { select: { workspaceId: true } } },
    });
    if (review?.insight?.workspaceId) {
      await this.prisma.auditEvent.create({
        data: {
          workspaceId: review.insight.workspaceId,
          actorUserId: input.authorUserId,
          action: "review.comment.added",
          entityType: "review",
          entityId: reviewId,
          metadata: { body: input.body },
        },
      });
    }
    if (review?.reviewerId && review.reviewerId !== input.authorUserId) {
      await this.prisma.notification.create({
        data: {
          userId: review.reviewerId,
          type: "review.comment",
          payload: { reviewId, insightId: review.insightId }
        }
      });
    }
    return comment;
  }

  async assignReviewer(reviewId: string, input: AssignReviewerInput) {
    const review = await this.prisma.review.update({
      where: { id: reviewId },
      data: { reviewerId: input.reviewerId, status: "in_review" }
    });

    await this.prisma.notification.create({
      data: {
        userId: input.reviewerId,
        type: "review.assigned",
        payload: { reviewId, insightId: review.insightId }
      }
    });

    await this.prisma.auditEvent.create({
      data: {
        workspaceId: input.workspaceId,
        actorUserId: input.actorUserId,
        action: "review.assigned",
        entityType: "review",
        entityId: reviewId,
        metadata: { reviewerId: input.reviewerId }
      }
    });

    return review;
  }
}
