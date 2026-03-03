/**
 * Server-only API fetch helper.
 * Reads the session cookie and attaches the Bearer token automatically.
 * Use this in server components and route handlers.
 */
import { bearerHeader } from "./session";

const API_BASE = () => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function apiFetch(
  path: string,
  options?: RequestInit,
): Promise<Response> {
  const auth = bearerHeader();
  return fetch(`${API_BASE()}${path}`, {
    cache: "no-store",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...auth,
      ...options?.headers,
    },
  });
}

/** Fetch JSON, return null on 404, throw on other errors. */
export async function apiFetchJson<T>(
  path: string,
  options?: RequestInit,
): Promise<T | null> {
  const res = await apiFetch(path, options);
  if (res.status === 404) return null;
  if (!res.ok) return null;
  return res.json() as Promise<T>;
}
