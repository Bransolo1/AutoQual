import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, getSessionToken } from "../../../../lib/session";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/logout
 *
 * Clears the session cookie and, if the IdP supports end-session, redirects
 * the browser to the IdP logout endpoint. Otherwise redirects to /auth/login.
 */
export async function POST(req: NextRequest) {
  const idToken = getSessionToken();
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

  let logoutUrl: string | null = null;

  if (idToken) {
    try {
      const res = await fetch(`${apiBase}/sso/logout`, {
        method: "GET",
        headers: { Authorization: `Bearer ${idToken}` },
        cache: "no-store",
      });
      if (res.ok) {
        const data = (await res.json()) as { status: string; logoutUrl?: string };
        if (data.status === "ok" && data.logoutUrl) {
          logoutUrl = data.logoutUrl;
        }
      }
    } catch {
      // Non-fatal: still clear the local session
    }
  }

  const dest = logoutUrl ?? new URL("/auth/login", req.url).toString();
  const resp = NextResponse.redirect(dest);
  resp.headers.set("Set-Cookie", clearSessionCookie());
  return resp;
}

/** Also support GET for simple link-based logout (less secure, use POST in forms). */
export async function GET(req: NextRequest) {
  return POST(req);
}
