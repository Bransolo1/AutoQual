import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateNotificationInput } from "./notifications.dto";

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list({
    userId,
    type,
    unread,
    limit,
  }: {
    userId: string;
    type?: string;
    unread?: boolean;
    limit?: number;
  }) {
    return this.prisma.notification.findMany({
      where: {
        userId,
        type: type || undefined,
        readAt: unread === undefined ? undefined : unread ? null : { not: null },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async create(input: CreateNotificationInput) {
    return this.prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        payload: input.payload as Prisma.InputJsonValue,
      },
    });
  }

  async markRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }
}
