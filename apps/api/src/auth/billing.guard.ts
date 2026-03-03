import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "../prisma/prisma.service";
import type { JwtPayload } from "./auth.guard";
import type { Request } from "express";

/**
 * Blocks requests from workspaces whose billingStatus is "suspended".
 * Apply globally (registered in AppModule providers) after AuthGuard.
 * Routes decorated @Public() bypass this guard.
 * Routes decorated @SkipBillingCheck() also bypass it.
 */
@Injectable()
export class BillingGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>("isPublic", [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const skipBilling = this.reflector.getAllAndOverride<boolean>("skipBillingCheck", [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skipBilling) return true;

    const req = context.switchToHttp().getRequest<Request & { user?: JwtPayload }>();
    const workspaceId = req.user?.workspaceId;
    if (!workspaceId) return true; // no workspace on token — let other guards handle it

    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { billingStatus: true },
    });

    if (workspace?.billingStatus === "suspended") {
      throw new ForbiddenException(
        "This workspace has been suspended. Contact support@sensehub.app.",
      );
    }

    return true;
  }
}
