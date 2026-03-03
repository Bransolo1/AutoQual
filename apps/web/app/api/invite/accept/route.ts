import { NextRequest, NextResponse } from "next/server";
import { bearerHeader } from "../../../../lib/session";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const res = await fetch(`${API_BASE}/workspaces/invitations/${encodeURIComponent(body.token)}/accept`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...bearerHeader() },
  }).catch(() => null);

  if (!res) return NextResponse.json({ message: "Service unavailable" }, { status: 503 });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
