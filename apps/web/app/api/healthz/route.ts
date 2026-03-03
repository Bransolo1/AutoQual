import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Health check endpoint used by Docker HEALTHCHECK and K8s readiness probe. */
export function GET() {
  return NextResponse.json({ status: "ok" }, { status: 200 });
}
