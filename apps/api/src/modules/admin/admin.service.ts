import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { WorkspacesService } from "../workspaces/workspaces.service";
import { QueueService } from "../../queue/queue.service";

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
  ) {}

  async listWorkspaces(query?: string) {
    return this.prisma.workspace.findMany({
      where: query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { slug: { contains: query, mode: "insensitive" } },
            ],
          }
        : undefined,
      select: {
        id: true,
        name: true,
        slug: true,
        billingStatus: true,
        trialEndsAt: true,
        createdAt: true,
        _count: { select: { users: true, projects: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  async provisionWorkspace(name: string, slug?: string, ownerEmail?: string) {
    return this.workspacesService.create({ name, slug }, undefined, ownerEmail);
  }

  async suspendWorkspace(id: string) {
    return this.prisma.workspace.update({
      where: { id },
      data: { billingStatus: "suspended" },
    });
  }
}
