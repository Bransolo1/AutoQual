import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateAttachmentInput } from "./attachments.dto";

@Injectable()
export class AttachmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(linkedEntityId: string) {
    return this.prisma.attachment.findMany({ where: { linkedEntityId } });
  }

  async create(input: CreateAttachmentInput) {
    return this.prisma.attachment.create({
      data: {
        linkedEntityType: input.linkedEntityType,
        linkedEntityId: input.linkedEntityId,
        filename: input.filename,
        storageKey: input.storageKey
      }
    });
  }
}
