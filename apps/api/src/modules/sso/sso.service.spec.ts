import { describe, expect, it } from "vitest";
import { SsoService } from "./sso.service";

describe("SsoService", () => {
  it("builds authorization URL with workspace state", async () => {
    process.env.SSO_CLIENT_ID = "client-1";
    process.env.SSO_REDIRECT_URI = "https://app.example.com/callback";
    process.env.SSO_ISSUER_URL = "https://idp.example.com";

    const service = new SsoService({} as any);
    (service as any).oidcConfig = {
      issuer: "https://idp.example.com",
      authorization_endpoint: "https://idp.example.com/auth",
      token_endpoint: "https://idp.example.com/token",
      jwks_uri: "https://idp.example.com/jwks",
    };

    const result = await service.getAuthorizationUrl("workspace-1");
    expect(result.authorizationUrl).toContain("client_id=client-1");
    expect(result.authorizationUrl).toContain("state=workspace-1");
  });
});
