import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const res = await fetch(`${API_BASE}/embed/${encodeURIComponent(token)}/study`).catch(() => null);
  if (!res || !res.ok) return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });
  return NextResponse.json(await res.json());
}
