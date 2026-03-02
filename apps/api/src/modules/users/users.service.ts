import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(workspaceId: string) {
    return this.prisma.user.findMany({
      where: { workspaceId },
      include: { roles: true },
      orderBy: { createdAt: "asc" },
    });
  }

  async updateRoles(userId: string, roles: string[]) {
    const normalized = roles.map((role) => role.trim()).filter(Boolean);
    return this.prisma.$transaction(async (tx) => {
      await tx.roleAssignment.deleteMany({ where: { userId } });
      if (normalized.length) {
        await tx.roleAssignment.createMany({
          data: normalized.map((role) => ({ userId, role })),
        });
      }
      return tx.user.findUniqueOrThrow({ where: { id: userId }, include: { roles: true } });
    });
  }
}
