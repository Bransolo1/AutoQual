import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";

/**
 * GET /api/auth/login
 *
 * Initiates the OIDC Authorization Code flow by redirecting the user to the
 * API's SSO authorize endpoint, which in turn redirects to the IdP.
 *
 * Query params:
 *   workspaceId – the tenant workspace (required)
 *   returnTo    – path to redirect to after login (optional, defaults to /)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const workspaceId = searchParams.get("workspaceId");
  const returnTo = searchParams.get("returnTo") ?? "/";

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
  }

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

  let authorizeUrl: string;
  try {
    const res = await fetch(`${apiBase}/sso/authorize?workspaceId=${encodeURIComponent(workspaceId)}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return NextResponse.json({ error: "SSO not configured", detail: body }, { status: 502 });
    }
    const data = (await res.json()) as { authorizationUrl: string };
    authorizeUrl = data.authorizationUrl;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ error: "Failed to reach API", detail: msg }, { status: 502 });
  }

  // Store the returnTo path in a short-lived state cookie so the callback
  // can redirect correctly without open-redirect risk.
  const nonce = randomBytes(8).toString("hex");
  const stateValue = Buffer.from(JSON.stringify({ returnTo, nonce })).toString("base64url");

  const resp = NextResponse.redirect(authorizeUrl);
  resp.cookies.set("__auth_state", stateValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 300, // 5 minutes
  });
  return resp;
}
