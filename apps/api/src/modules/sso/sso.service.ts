import { ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { PrismaService } from "../../prisma/prisma.service";

type OidcConfig = {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
};

@Injectable()
export class SsoService {
  private oidcConfig?: OidcConfig;
  private jwks?: ReturnType<typeof createRemoteJWKSet>;

  constructor(private readonly prisma: PrismaService) {}

  async getAuthorizationUrl(workspaceId: string) {
    const { authorization_endpoint, issuer } = await this.loadOidcConfig();
    const clientId = process.env.SSO_CLIENT_ID ?? "";
    const redirectUri = process.env.SSO_REDIRECT_URI ?? "";
    if (!clientId || !redirectUri) {
      throw new UnauthorizedException("SSO not configured");
    }
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state: workspaceId,
    });
    return { authorizationUrl: `${authorization_endpoint}?${params.toString()}`, issuer, clientId, redirectUri };
  }

  async exchangeCode(code: string, workspaceId: string) {
    const { token_endpoint, issuer, jwks_uri } = await this.loadOidcConfig();
    const clientId = process.env.SSO_CLIENT_ID ?? "";
    const clientSecret = process.env.SSO_CLIENT_SECRET ?? "";
    const redirectUri = process.env.SSO_REDIRECT_URI ?? "";

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    });

    const res = await fetch(token_endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok) {
      throw new UnauthorizedException("SSO token exchange failed");
    }
    const tokenResponse = (await res.json()) as { id_token: string; access_token?: string };
    if (!tokenResponse.id_token) {
      throw new UnauthorizedException("Missing id_token");
    }

    if (!this.jwks) {
      this.jwks = createRemoteJWKSet(new URL(jwks_uri));
    }
    const { payload } = await jwtVerify(tokenResponse.id_token, this.jwks, {
      issuer,
      audience: clientId,
    });

    const email = payload.email as string | undefined;
    const name = (payload.name as string | undefined) ?? email ?? "SSO User";
    if (!email) {
      throw new UnauthorizedException("SSO email claim missing");
    }
    this.assertAllowedDomain(email);

    const role = this.resolveRole(payload);

    const user = await this.upsertUser({
      workspaceId,
      email,
      name,
      role,
    });

    return {
      idToken: tokenResponse.id_token,
      accessToken: tokenResponse.access_token,
      user,
    };
  }

  private async loadOidcConfig(): Promise<OidcConfig> {
    if (this.oidcConfig) return this.oidcConfig;
    const issuer = process.env.SSO_ISSUER_URL ?? "";
    if (!issuer) {
      throw new UnauthorizedException("SSO issuer not configured");
    }
    const res = await fetch(`${issuer.replace(/\/$/, "")}/.well-known/openid-configuration`);
    if (!res.ok) {
      throw new UnauthorizedException("Failed to load OIDC configuration");
    }
    this.oidcConfig = (await res.json()) as OidcConfig;
    return this.oidcConfig;
  }

  private assertAllowedDomain(email: string) {
    const allowed = (process.env.SSO_ALLOWED_DOMAINS ?? "")
      .split(",")
      .map((domain) => domain.trim().toLowerCase())
      .filter(Boolean);
    if (!allowed.length) return;
    const domain = email.split("@")[1]?.toLowerCase();
    if (!domain || !allowed.includes(domain)) {
      throw new ForbiddenException("SSO domain not allowed");
    }
  }

  private resolveRole(payload: Record<string, unknown>) {
    const defaultRole = process.env.SSO_DEFAULT_ROLE ?? "researcher";
    const mapRaw = process.env.SSO_GROUP_ROLE_MAP ?? "";
    if (!mapRaw) return defaultRole;
    try {
      const mapping = JSON.parse(mapRaw) as Record<string, string>;
      const groups = Array.isArray(payload.groups) ? payload.groups : [];
      for (const group of groups) {
        const role = mapping[String(group)];
        if (role) return role;
      }
    } catch {
      return defaultRole;
    }
    return defaultRole;
  }

  private async upsertUser(input: { workspaceId: string; email: string; name: string; role: string }) {
    const existing = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (existing && existing.workspaceId !== input.workspaceId) {
      throw new ForbiddenException("User exists in another workspace");
    }
    const user = existing
      ? await this.prisma.user.update({
          where: { email: input.email },
          data: { name: input.name },
        })
      : await this.prisma.user.create({
          data: {
            email: input.email,
            name: input.name,
            workspaceId: input.workspaceId,
          },
        });

    const existingRole = await this.prisma.roleAssignment.findFirst({
      where: { userId: user.id, role: input.role },
    });
    if (!existingRole) {
      await this.prisma.roleAssignment.create({
        data: { userId: user.id, role: input.role },
      });
    }
    return { ...user, role: input.role };
  }
}
