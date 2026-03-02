import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateAccessReviewInput } from "./access-reviews.dto";
import { Prisma } from "@prisma/client";

@Injectable()
export class AccessReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(workspaceId: string, limit?: number) {
    return this.prisma.accessReview.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async create(input: CreateAccessReviewInput) {
    return this.prisma.accessReview.create({
      data: {
        workspaceId: input.workspaceId,
        reviewerUserId: input.reviewerUserId,
        notes: input.notes?.trim() || undefined,
        reviewedUserIds: input.reviewedUserIds
          ? (input.reviewedUserIds as Prisma.InputJsonValue)
          : undefined,
      },
    });
  }
}
