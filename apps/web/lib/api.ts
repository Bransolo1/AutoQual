export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const DEV_TOKEN = process.env.NEXT_PUBLIC_DEV_TOKEN ?? "";

export const HEADERS: Record<string, string> = {
  "x-workspace-id": "demo-workspace-id",
  "x-user-id": "demo-user",
  ...(DEV_TOKEN ? { Authorization: `Bearer ${DEV_TOKEN}` } : {}),
};

export const CLIENT_HEADERS: Record<string, string> = {
  ...HEADERS,
  "x-role": "client",
};

export function jsonHeaders(base: Record<string, string> = HEADERS): Record<string, string> {
  return { ...base, "Content-Type": "application/json" };
}
