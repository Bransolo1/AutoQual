import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateMilestoneInput } from "./milestones.dto";

@Injectable()
export class MilestonesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(projectId: string) {
    return this.prisma.milestone.findMany({ where: { projectId } });
  }

  async create(input: CreateMilestoneInput) {
    return this.prisma.milestone.create({
      data: {
        projectId: input.projectId,
        name: input.name,
        dueDate: new Date(input.dueDate),
        status: input.status,
        orderIndex: input.orderIndex
      }
    });
  }
}
