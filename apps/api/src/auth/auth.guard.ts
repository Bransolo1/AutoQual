import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import { IS_PUBLIC_KEY } from "./public.decorator";
import { PrismaService } from "../prisma/prisma.service";

export type JwtPayload = {
  sub: string;
  workspaceId: string;
  role: string;
  email?: string;
  iss?: string;
  aud?: string | string[];
  jti?: string;
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;
    const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const xUserId = request.headers["x-user-id"] as string | undefined;
    const xWorkspaceId = request.headers["x-workspace-id"] as string | undefined;
    const xRole = request.headers["x-role"] as string | undefined;

    if (xUserId && xWorkspaceId) {
      (request as Request & { user: JwtPayload }).user = {
        sub: xUserId,
        workspaceId: xWorkspaceId,
        role: xRole ?? "researcher",
      };
      return true;
    }

    if (!bearer) {
      throw new UnauthorizedException("Missing or invalid authorization");
    }

    try {
      const payload = this.decodeJwt(bearer) as JwtPayload;
      this.assertIssuer(payload);
      this.assertAudience(payload);
      await this.assertJti(payload);
      if (!payload.sub || !payload.workspaceId) {
        throw new UnauthorizedException("Invalid token payload");
      }
      (request as Request & { user: JwtPayload }).user = {
        ...payload,
        role: payload.role ?? "researcher",
      };
      return true;
    } catch {
      throw new UnauthorizedException("Invalid or expired token");
    }
  }

  private decodeJwt(token: string): unknown {
    const parts = token.split(".");
    if (parts.length !== 3) throw new Error("Invalid JWT");
    const payload = Buffer.from(parts[1], "base64url").toString("utf8");
    return JSON.parse(payload) as unknown;
  }

  private assertIssuer(payload: JwtPayload) {
    const expectedIssuer = process.env.JWT_ISSUER;
    if (!expectedIssuer) return;
    if (!payload.iss || payload.iss !== expectedIssuer) {
      throw new UnauthorizedException("Invalid token issuer");
    }
  }

  private assertAudience(payload: JwtPayload) {
    const expectedAudience = process.env.JWT_AUDIENCE;
    if (!expectedAudience) return;
    const aud = payload.aud;
    if (!aud) {
      throw new UnauthorizedException("Invalid token audience");
    }
    if (Array.isArray(aud)) {
      if (!aud.includes(expectedAudience)) {
        throw new UnauthorizedException("Invalid token audience");
      }
      return;
    }
    if (aud !== expectedAudience) {
      throw new UnauthorizedException("Invalid token audience");
    }
  }

  private async assertJti(payload: JwtPayload) {
    const requireJti = process.env.JWT_REQUIRE_JTI === "true";
    if (requireJti && !payload.jti) {
      throw new UnauthorizedException("Missing token id");
    }
    if (!payload.jti) return;
    const revoked = await this.prisma.revokedToken.findUnique({
      where: { jti: payload.jti },
      select: { expiresAt: true },
    });
    if (!revoked) return;
    if (revoked.expiresAt.getTime() > Date.now()) {
      throw new UnauthorizedException("Token revoked");
    }
  }
}
