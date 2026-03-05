import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function POST(req: Request) {
  const body = await req.json();
  const { sessionId, lastUserMessage } = body as { sessionId: string; lastUserMessage?: string };
  if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

  const res = await fetch(`${API_BASE}/moderator/${sessionId}/next-turn`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lastUserMessage }),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
