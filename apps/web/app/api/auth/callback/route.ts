import { NextRequest, NextResponse } from "next/server";
import { buildSessionCookie } from "../../../../lib/session";

export const dynamic = "force-dynamic";

/**
 * GET /api/auth/callback
 *
 * Handles the OIDC redirect from the IdP. Delegates the code exchange to
 * the API (which knows the client secret), then stores the returned JWT in
 * a signed httpOnly session cookie.
 *
 * Expected query params from IdP redirect:
 *   code  – authorization code
 *   state – workspaceId (set by API's authorize endpoint)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // workspaceId passed through OIDC state
  const errorParam = searchParams.get("error");

  if (errorParam) {
    const desc = searchParams.get("error_description") ?? errorParam;
    return NextResponse.redirect(new URL(`/auth/login?error=${encodeURIComponent(desc)}`, req.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/auth/login?error=missing_params", req.url));
  }

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

  let idToken: string;
  try {
    const res = await fetch(
      `${apiBase}/sso/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`,
      { cache: "no-store" },
    );
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error({ msg: "SSO callback failed", status: res.status, body });
      return NextResponse.redirect(new URL("/auth/login?error=exchange_failed", req.url));
    }
    const data = (await res.json()) as { idToken?: string };
    if (!data.idToken) {
      return NextResponse.redirect(new URL("/auth/login?error=no_token", req.url));
    }
    idToken = data.idToken;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.error({ msg: "SSO callback error", err: msg });
    return NextResponse.redirect(new URL("/auth/login?error=api_unreachable", req.url));
  }

  // Read the returnTo path from the state cookie set during /api/auth/login
  let returnTo = "/";
  const stateCookie = req.cookies.get("__auth_state")?.value;
  if (stateCookie) {
    try {
      const parsed = JSON.parse(Buffer.from(stateCookie, "base64url").toString("utf8")) as {
        returnTo?: string;
      };
      const candidate = parsed.returnTo ?? "/";
      // Only allow relative paths (prevent open redirect)
      returnTo = candidate.startsWith("/") ? candidate : "/";
    } catch {
      // ignore
    }
  }

  const dest = new URL(returnTo, req.url);
  const resp = NextResponse.redirect(dest);

  // Set signed session cookie (24-hour lifetime matches JWT default)
  resp.headers.set("Set-Cookie", buildSessionCookie(idToken, 86_400));

  // Clear the auth state cookie
  resp.cookies.set("__auth_state", "", { maxAge: 0, path: "/" });

  return resp;
}
