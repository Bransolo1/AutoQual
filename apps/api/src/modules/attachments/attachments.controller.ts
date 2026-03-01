import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { AttachmentsService } from "./attachments.service";
import { CreateAttachmentInput } from "./attachments.dto";

@Controller("attachments")
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Get()
  list(@Query("linkedEntityId") linkedEntityId: string) {
    return this.attachmentsService.list(linkedEntityId);
  }

  @Post()
  create(@Body() input: CreateAttachmentInput) {
    return this.attachmentsService.create(input);
  }
}
