"use client";
/**
 * Client-side API hook.
 * Reads the JWT from TokenProvider context and builds authenticated fetch calls.
 * Use this in "use client" components.
 *
 * Example:
 *   const { apiFetch, user } = useApi();
 *   const data = await apiFetch("/projects").then(r => r.json());
 */
import { useCallback } from "react";
import { useToken } from "./token-context";
import type { SessionUser } from "./session";

type UseApiReturn = {
  apiFetch: (path: string, options?: RequestInit) => Promise<Response>;
  user: SessionUser | null;
  token: string | null;
};

export function useApi(): UseApiReturn {
  const { token, user } = useToken();
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

  const apiFetch = useCallback(
    (path: string, options?: RequestInit): Promise<Response> => {
      const auth: Record<string, string> = token
        ? { Authorization: `Bearer ${token}` }
        : {};
      return fetch(`${apiBase}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...auth,
          ...options?.headers,
        },
      });
    },
    [token, apiBase],
  );

  return { apiFetch, user, token };
}
