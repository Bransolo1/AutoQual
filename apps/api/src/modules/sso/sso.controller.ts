import { Controller, Get, Post, Query } from "@nestjs/common";

@Controller("auth/sso")
export class SsoController {
  @Get("config")
  getConfig() {
    return {
      enabled: process.env.SSO_ENABLED === "true",
      issuerUrl: process.env.SSO_ISSUER_URL ?? "",
      clientId: process.env.SSO_CLIENT_ID ?? "",
      redirectUri: process.env.SSO_REDIRECT_URI ?? "",
    };
  }

  @Post("callback")
  callback(@Query("code") code?: string) {
    if (process.env.SSO_ENABLED !== "true") {
      return { status: "disabled" };
    }
    if (!code) {
      return { status: "missing_code" };
    }
    return {
      status: "stubbed",
      message: "SSO callback placeholder. Exchange code with your IdP in production.",
    };
  }
}
