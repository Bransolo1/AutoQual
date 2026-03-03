import { type NextRequest, NextResponse } from "next/server";

/**
 * Route protection middleware.
 *
 * Public routes (no session required):
 *   /auth/**          – login pages
 *   /api/auth/**      – login/callback/logout API routes
 *   /api/healthz      – health check for K8s readiness probes
 *   /embed/**         – public embed views (auth handled by signed embed tokens)
 *
 * All other routes require a valid __session cookie.
 * Unauthenticated requests are redirected to /auth/login with a returnTo param.
 */

const PUBLIC_PREFIXES = [
  "/auth/",
  "/api/auth/",
  "/api/healthz",
  "/api/invite/",
  "/invite/",
  "/embed/",
  "/_next/",
  "/favicon",
  "/maintenance",
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

const SESSION_COOKIE = "__session";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublic(pathname)) return NextResponse.next();

  const sessionCookie = req.cookies.get(SESSION_COOKIE)?.value;

  if (!sessionCookie) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("returnTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Basic structural check: our cookie format is <base64url>.<hex-sig>
  // Full verification happens inside lib/session (server component) and in the API.
  const dot = sessionCookie.lastIndexOf(".");
  if (dot === -1) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("returnTo", pathname);
    loginUrl.searchParams.set("error", "session_expired");
    const resp = NextResponse.redirect(loginUrl);
    resp.cookies.set(SESSION_COOKIE, "", { maxAge: 0, path: "/" });
    return resp;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except static files.
     * Next.js internals and static assets bypass the middleware automatically.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
