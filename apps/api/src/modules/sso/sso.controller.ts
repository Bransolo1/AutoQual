import { Controller, Get, Post, Query } from "@nestjs/common";
import { Roles } from "../../auth/roles.decorator";
import { SsoService } from "./sso.service";
import { SsoCallbackResponse, SsoLoginResponse } from "./sso.dto";

@Controller("auth/sso")
export class SsoController {
  constructor(private readonly ssoService: SsoService) {}

  @Get("config")
  getConfig() {
    return {
      enabled: process.env.SSO_ENABLED === "true",
      issuerUrl: process.env.SSO_ISSUER_URL ?? "",
      clientId: process.env.SSO_CLIENT_ID ?? "",
      redirectUri: process.env.SSO_REDIRECT_URI ?? "",
    };
  }

  @Get("login")
  @Roles("admin")
  async login(@Query("workspaceId") workspaceId?: string): Promise<SsoLoginResponse> {
    if (process.env.SSO_ENABLED !== "true") {
      return {
        authorizationUrl: "",
        issuer: process.env.SSO_ISSUER_URL ?? "",
        clientId: process.env.SSO_CLIENT_ID ?? "",
        redirectUri: process.env.SSO_REDIRECT_URI ?? "",
      };
    }
    if (!workspaceId) {
      return {
        authorizationUrl: "",
        issuer: process.env.SSO_ISSUER_URL ?? "",
        clientId: process.env.SSO_CLIENT_ID ?? "",
        redirectUri: process.env.SSO_REDIRECT_URI ?? "",
      };
    }
    return this.ssoService.getAuthorizationUrl(workspaceId);
  }

  @Post("callback")
  async callback(
    @Query("code") code?: string,
    @Query("workspaceId") workspaceId?: string
  ): Promise<SsoCallbackResponse> {
    if (process.env.SSO_ENABLED !== "true") {
      return { status: "disabled" };
    }
    if (!code) {
      return { status: "missing_code" };
    }
    if (!workspaceId) {
      return { status: "missing_code" };
    }
    const result = await this.ssoService.exchangeCode(code, workspaceId);
    return {
      status: "ok",
      idToken: result.idToken,
      accessToken: result.accessToken,
      user: result.user,
    };
  }
}
