import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function POST(req: NextRequest) {
  const { token, email, locale, source, segment } = await req.json().catch(() => ({}));
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const res = await fetch(`${API_BASE}/embed/${encodeURIComponent(token)}/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email ?? "anonymous@participant.local", locale, source, segment, consented: true }),
  }).catch(() => null);

  if (!res || !res.ok) {
    const msg = await res?.text().catch(() => "");
    return NextResponse.json({ error: "Failed to start session", detail: msg }, { status: 500 });
  }
  return NextResponse.json(await res.json());
}
