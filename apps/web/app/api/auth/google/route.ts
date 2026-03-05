import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";

/**
 * GET /api/auth/google
 *
 * Initiates the Google OAuth 2.0 Authorization Code flow.
 * Redirects the user to Google's consent screen.
 *
 * Query params:
 *   returnTo – path to redirect to after login (optional, defaults to /)
 */
export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "Google OAuth is not configured. Set GOOGLE_CLIENT_ID." },
      { status: 503 },
    );
  }

  const returnTo = req.nextUrl.searchParams.get("returnTo") ?? "/";
  const nonce = randomBytes(16).toString("hex");

  // Store returnTo + nonce in a short-lived state cookie (prevents open redirect & CSRF)
  const statePayload = Buffer.from(JSON.stringify({ returnTo, nonce })).toString("base64url");

  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ??
    `${req.nextUrl.origin}/api/auth/google/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state: statePayload,
    access_type: "online",
    prompt: "select_account",
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  const resp = NextResponse.redirect(googleAuthUrl);
  resp.cookies.set("__google_state", statePayload, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 300, // 5 minutes
  });

  return resp;
}
