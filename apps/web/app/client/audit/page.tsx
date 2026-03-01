"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const HEADERS = { "x-workspace-id": "demo-workspace-id", "x-user-id": "demo-user", "x-role": "client" };

type AuditEvent = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
};

export default function ClientAuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/audit?workspaceId=demo-workspace-id&limit=30`, { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : []))
      .then(setEvents);
  }, []);

  return (
    <main className="min-h-screen px-8 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Client Audit Log</h1>
        <Link href="/client" className="text-brand-600 hover:underline">
          Back to portal
        </Link>
      </div>
      <p className="mt-2 text-sm text-gray-600">Read-only summary of key actions.</p>
      <div className="mt-6 grid gap-4">
        {events.length === 0 && (
          <div className="rounded-2xl bg-white p-6 text-sm text-gray-500 shadow-sm">
            No audit events available.
          </div>
        )}
        {events.map((event) => (
          <div key={event.id} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">{event.action}</span>
              <span className="text-xs text-gray-400">{new Date(event.createdAt).toLocaleString()}</span>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              {event.entityType} · {event.entityId}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
