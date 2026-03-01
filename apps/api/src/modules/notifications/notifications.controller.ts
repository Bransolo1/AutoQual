import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { CreateNotificationInput } from "./notifications.dto";

@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(
    @Query("userId") userId: string,
    @Query("type") type?: string,
    @Query("unread") unread?: string,
    @Query("limit") limit?: string,
  ) {
    return this.notificationsService.list({
      userId,
      type,
      unread: unread === undefined ? undefined : unread === "true",
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Post()
  create(@Body() input: CreateNotificationInput) {
    return this.notificationsService.create(input);
  }

  @Patch(":id/read")
  markRead(@Param("id") id: string) {
    return this.notificationsService.markRead(id);
  }
}
