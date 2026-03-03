import { NextRequest, NextResponse } from "next/server";
import { bearerHeader } from "../../../../lib/session";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.email || !body?.type) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Forward to the API for audit logging and email dispatch
  const res = await fetch(`${API_BASE}/legal/data-requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...bearerHeader() },
    body: JSON.stringify(body),
  }).catch(() => null);

  if (!res || !res.ok) {
    // Fallback: log to console so the request isn't silently lost
    console.error("[data-request] Failed to forward to API; body:", body);
    return NextResponse.json({ message: "Request logged. We will respond within 30 days." });
  }

  return NextResponse.json({ message: "Request submitted." });
}
