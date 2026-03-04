import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function POST(req: NextRequest) {
  const { token, sessionId, speaker, content } = await req.json().catch(() => ({}));
  if (!token || !sessionId) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const res = await fetch(`${API_BASE}/embed/${encodeURIComponent(token)}/turn`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, speaker: speaker ?? "participant", content }),
  }).catch(() => null);

  if (!res || !res.ok) return NextResponse.json({ error: "Failed to record turn" }, { status: 500 });
  return NextResponse.json(await res.json());
}
