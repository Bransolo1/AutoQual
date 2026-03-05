import { NextRequest, NextResponse } from "next/server";
import { buildSessionCookie } from "../../../../../lib/session";

export const dynamic = "force-dynamic";

type GoogleTokenResponse = {
  access_token?: string;
  id_token?: string;
  expires_in?: number;
  token_type?: string;
  error?: string;
  error_description?: string;
};

type GoogleUserInfo = {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
  email_verified?: boolean;
};

/**
 * GET /api/auth/google/callback
 *
 * Handles the redirect from Google after the user grants consent.
 * Exchanges the authorization code for tokens, fetches the user profile,
 * mints a session JWT, and stores it in a signed httpOnly cookie.
 *
 * The session JWT contains standard OIDC claims (sub, email, name) so the
 * rest of the app works without changes.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const errorParam = searchParams.get("error");

  if (errorParam) {
    const desc = searchParams.get("error_description") ?? errorParam;
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent(desc)}`, req.url),
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/auth/login?error=missing_params", req.url));
  }

  // Validate state matches what we stored (CSRF protection)
  const stateCookie = req.cookies.get("__google_state")?.value;
  if (!stateCookie || stateCookie !== state) {
    return NextResponse.redirect(new URL("/auth/login?error=state_mismatch", req.url));
  }

  // Parse returnTo from state payload
  let returnTo = "/";
  try {
    const parsed = JSON.parse(Buffer.from(state, "base64url").toString("utf8")) as {
      returnTo?: string;
    };
    const candidate = parsed.returnTo ?? "/";
    returnTo = candidate.startsWith("/") ? candidate : "/";
  } catch {
    // ignore, use default
  }

  const clientId = process.env.GOOGLE_CLIENT_ID ?? "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? "";
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ?? `${req.nextUrl.origin}/api/auth/google/callback`;

  // Exchange authorization code for tokens
  let tokenData: GoogleTokenResponse;
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    tokenData = (await tokenRes.json()) as GoogleTokenResponse;
  } catch {
    return NextResponse.redirect(new URL("/auth/login?error=exchange_failed", req.url));
  }

  if (tokenData.error || !tokenData.access_token) {
    return NextResponse.redirect(new URL("/auth/login?error=exchange_failed", req.url));
  }

  // Fetch user profile from Google
  let userInfo: GoogleUserInfo;
  try {
    const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!userRes.ok) {
      return NextResponse.redirect(new URL("/auth/login?error=exchange_failed", req.url));
    }
    userInfo = (await userRes.json()) as GoogleUserInfo;
  } catch {
    return NextResponse.redirect(new URL("/auth/login?error=exchange_failed", req.url));
  }

  if (!userInfo.email || !userInfo.sub) {
    return NextResponse.redirect(new URL("/auth/login?error=no_token", req.url));
  }

  // Notify the API to upsert the user (best-effort — non-blocking)
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  const defaultWorkspaceId = process.env.DEFAULT_WORKSPACE_ID ?? "default";
  try {
    await fetch(`${apiBase}/auth/google/upsert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sub: userInfo.sub,
        email: userInfo.email,
        name: userInfo.name ?? userInfo.email,
        workspaceId: defaultWorkspaceId,
      }),
    });
  } catch {
    // Non-fatal: user will still be logged in; DB sync happens on next API call
  }

  // Build a minimal session JWT from Google's user info.
  // We use the Google id_token directly if available (it's a valid OIDC token).
  // If the API is configured with JWT_JWKS_URL=https://www.googleapis.com/oauth2/v3/certs
  // it will verify this token automatically.
  const sessionToken = tokenData.id_token ?? buildFallbackJwt(userInfo);

  const dest = new URL(returnTo, req.url);
  const resp = NextResponse.redirect(dest);

  // Store in 24-hour signed session cookie
  resp.headers.set("Set-Cookie", buildSessionCookie(sessionToken, 86_400));

  // Clear the Google state cookie
  resp.cookies.set("__google_state", "", { maxAge: 0, path: "/" });

  return resp;
}

/**
 * Build a minimal unsigned JWT for environments where no Google id_token is returned.
 * This is a fallback — in normal Google OAuth flows id_token is always returned.
 * The API must be configured to accept this (e.g. JWT_SECRET for HS256 dev mode).
 */
function buildFallbackJwt(user: GoogleUserInfo): string {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(
    JSON.stringify({
      sub: user.sub,
      email: user.email,
      name: user.name ?? user.email,
      email_verified: user.email_verified ?? false,
      iss: "https://accounts.google.com",
      aud: process.env.GOOGLE_CLIENT_ID ?? "",
      iat: now,
      exp: now + 86_400,
      role: "researcher",
    }),
  ).toString("base64url");
  return `${header}.${payload}.`;
}
