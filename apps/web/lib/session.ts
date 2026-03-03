/**
 * Session utilities – server-side only.
 *
 * Strategy: the OIDC id_token is stored verbatim in an httpOnly, Secure,
 * SameSite=Lax cookie. The web app treats it as an opaque bearer credential
 * and forwards it to the API on every request. The API performs full JWT
 * verification (signature, issuer, audience, expiry, revocation).
 *
 * To prevent cookie tampering we append an HMAC signature with SESSION_SECRET.
 * Cookie format:  <base64url(jwt)>.<hmac-sha256-hex>
 */

import { createHmac } from "crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "__session";
const ONE_DAY_SECS = 86_400;

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error("SESSION_SECRET must be set and at least 32 characters long");
  }
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

function encode(jwt: string): string {
  const b64 = Buffer.from(jwt).toString("base64url");
  return `${b64}.${sign(b64)}`;
}

function decode(cookie: string): string | null {
  const dot = cookie.lastIndexOf(".");
  if (dot === -1) return null;
  const b64 = cookie.slice(0, dot);
  const sig = cookie.slice(dot + 1);
  const expected = sign(b64);
  // Constant-time comparison
  if (sig.length !== expected.length) return null;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  if (diff !== 0) return null;
  return Buffer.from(b64, "base64url").toString("utf8");
}

/** Write the signed session cookie after successful SSO login. */
export function buildSessionCookie(jwt: string, maxAgeSecs = ONE_DAY_SECS): string {
  const value = encode(jwt);
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${value}; HttpOnly${secure}; SameSite=Lax; Path=/; Max-Age=${maxAgeSecs}`;
}

/** Delete the session cookie. */
export function clearSessionCookie(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE}=; HttpOnly${secure}; SameSite=Lax; Path=/; Max-Age=0`;
}

/** Read and verify the session cookie, returning the raw JWT or null. */
export function getSessionToken(): string | null {
  try {
    const jar = cookies();
    const raw = jar.get(SESSION_COOKIE)?.value;
    if (!raw) return null;
    return decode(raw);
  } catch {
    return null;
  }
}

/** Build Authorization header value from the session token. */
export function bearerHeader(): Record<string, string> {
  const token = getSessionToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

/** Decode JWT claims without verification (web app only previews claims). */
export function decodeJwtClaims(jwt: string): Record<string, unknown> {
  try {
    const parts = jwt.split(".");
    if (parts.length !== 3) return {};
    return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export type SessionUser = {
  sub: string;
  email?: string;
  name?: string;
  role?: string;
  workspaceId?: string;
};

export function getSessionUser(): SessionUser | null {
  const token = getSessionToken();
  if (!token) return null;
  const claims = decodeJwtClaims(token);
  if (!claims.sub) return null;
  // Check expiry client-side so we can redirect without an API round-trip.
  const exp = typeof claims.exp === "number" ? claims.exp : 0;
  if (exp && Date.now() / 1000 > exp) return null;
  return {
    sub: claims.sub as string,
    email: claims.email as string | undefined,
    name: claims.name as string | undefined,
    role: claims.role as string | undefined,
    workspaceId: claims.workspaceId as string | undefined,
  };
}
