import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import { createRemoteJWKSet, importSPKI, jwtVerify, type KeyLike } from "jose";
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
  private jwks?: ReturnType<typeof createRemoteJWKSet>;
  private publicKey?: KeyLike;
  private secretKey?: Uint8Array;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;
    const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!bearer) {
      throw new UnauthorizedException("Missing or invalid authorization");
    }

    try {
      const payload = await this.verifyToken(bearer);
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

  private async verifyToken(token: string): Promise<JwtPayload> {
    const key = await this.getVerificationKey();
    const issuer = process.env.JWT_ISSUER || undefined;
    const audience = process.env.JWT_AUDIENCE || undefined;
    const algorithm = process.env.JWT_ALGORITHM || undefined;

    const { payload } = await jwtVerify(token, key, {
      issuer,
      audience,
      algorithms: algorithm ? [algorithm] : undefined,
    });

    return payload as JwtPayload;
  }

  private async getVerificationKey() {
    const jwksUrl = process.env.JWT_JWKS_URL;
    if (jwksUrl) {
      if (!this.jwks) {
        this.jwks = createRemoteJWKSet(new URL(jwksUrl));
      }
      return this.jwks;
    }

    const publicKey = process.env.JWT_PUBLIC_KEY;
    if (publicKey) {
      if (!this.publicKey) {
        const algorithm = process.env.JWT_ALGORITHM ?? "RS256";
        this.publicKey = await importSPKI(publicKey, algorithm);
      }
      return this.publicKey;
    }

    const secret = process.env.JWT_SECRET;
    if (secret) {
      if (!this.secretKey) {
        this.secretKey = new TextEncoder().encode(secret);
      }
      return this.secretKey;
    }

    throw new UnauthorizedException("Token verification not configured");
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
