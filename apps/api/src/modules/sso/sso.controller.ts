import { Controller, Get, Post, Query } from "@nestjs/common";
import { Roles } from "../../auth/roles.decorator";
import { SsoService } from "./sso.service";
import {
  SsoCallbackResponse,
  SsoLoginResponse,
  SsoLogoutInput,
  SsoLogoutResponse,
  SsoRefreshInput,
  SsoRefreshResponse,
} from "./sso.dto";

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
      refreshToken: result.refreshToken,
      user: result.user,
    };
  }

  @Post("refresh")
  async refresh(@Query() input: SsoRefreshInput): Promise<SsoRefreshResponse> {
    if (process.env.SSO_ENABLED !== "true") {
      return { status: "disabled" };
    }
    if (!input.refreshToken || !input.workspaceId) {
      return { status: "missing_refresh" };
    }
    const result = await this.ssoService.refreshSession(input.refreshToken, input.workspaceId);
    return {
      status: "ok",
      idToken: result.idToken,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }

  @Post("logout")
  async logout(@Query() input: SsoLogoutInput): Promise<SsoLogoutResponse> {
    if (process.env.SSO_ENABLED !== "true") {
      return { status: "disabled" };
    }
    if (!input.idToken) {
      return { status: "missing_id_token" };
    }
    const result = await this.ssoService.getLogoutUrl(input.idToken, input.postLogoutRedirectUri);
    return result;
  }
}
