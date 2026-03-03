import { NextRequest, NextResponse } from "next/server";
import { bearerHeader } from "../../../../lib/session";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  // Forward to the API — the invitation preview endpoint is public (no auth required)
  const res = await fetch(`${API_BASE}/workspaces/invitations/${encodeURIComponent(token)}/preview`, {
    headers: { ...bearerHeader() },
  }).catch(() => null);

  if (!res || !res.ok) return NextResponse.json(null, { status: 404 });
  const data = await res.json();
  return NextResponse.json(data);
}
