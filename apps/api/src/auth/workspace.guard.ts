import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from "@nestjs/common";
import { Request } from "express";
import { JwtPayload } from "./auth.guard";

const CLIENT_READ_ONLY_ROUTES = ["/projects", "/milestones", "/approvals", "/client"];

@Injectable()
export class WorkspaceGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: JwtPayload }>();
    const user = request.user;
    if (!user) return true;

    const url = request.url?.split("?")[0] ?? "";
    const isGet = request.method === "GET";
    const isClientRoute = url.includes("/client") || request.headers["x-client-portal"] === "true";

    if (user.role === "client") {
      if (isClientRoute && isGet) return true;
      const allowedRead = CLIENT_READ_ONLY_ROUTES.some((r) => url.startsWith(r)) && isGet;
      const allowedApprovalDecision = url.startsWith("/approvals/") && request.method === "PATCH";
      if (!allowedRead && !allowedApprovalDecision) {
        throw new ForbiddenException("Client role has restricted access");
      }
    }

    const workspaceId = request.headers["x-workspace-id"] ?? user.workspaceId;
    if (workspaceId && workspaceId !== user.workspaceId) {
      throw new ForbiddenException("Workspace mismatch");
    }
    return true;
  }
}
