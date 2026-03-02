"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const HEADERS = { "x-workspace-id": "demo-workspace-id", "x-user-id": "demo-user" };

type AuditEvent = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
};

export default function AuditLogPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [entityType, setEntityType] = useState("");
  const [entityId, setEntityId] = useState("");
  const [limit, setLimit] = useState("50");
  const [actionFilter, setActionFilter] = useState("");
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [retentionStatus, setRetentionStatus] = useState<string | null>(null);
  const workspaceId = "demo-workspace-id";

  useEffect(() => {
    const params = new URLSearchParams({ workspaceId, limit });
    if (entityType) params.set("entityType", entityType);
    if (entityId) params.set("entityId", entityId);
    fetch(`${API_BASE}/audit?${params.toString()}`, { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : []))
      .then(setEvents);
  }, [entityType, entityId, limit, workspaceId]);

  const filteredEvents = useMemo(() => {
    if (!actionFilter.trim()) return events;
    const needle = actionFilter.trim().toLowerCase();
    return events.filter((event) => event.action.toLowerCase().includes(needle));
  }, [events, actionFilter]);

  return (
    <main className="min-h-screen px-8 py-10">
      <h1 className="text-2xl font-semibold">Audit Log</h1>
      <p className="mt-2 text-sm text-gray-600">Immutable record of project activity.</p>
      <div className="mt-4 flex flex-wrap gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <input
          value={entityType}
          onChange={(event) => setEntityType(event.target.value)}
          placeholder="Entity type (task, approval, review)"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        <input
          value={entityId}
          onChange={(event) => setEntityId(event.target.value)}
          placeholder="Entity ID"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        <input
          value={actionFilter}
          onChange={(event) => setActionFilter(event.target.value)}
          placeholder="Action (retention.queued)"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        <select
          value={limit}
          onChange={(event) => setLimit(event.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="20">20 results</option>
          <option value="50">50 results</option>
          <option value="100">100 results</option>
        </select>
        <button
          type="button"
          onClick={() => setActionFilter("retention.")}
          className="rounded-full border border-gray-200 px-3 py-2 text-xs text-gray-600"
        >
          Retention events
        </button>
        <button
          type="button"
          onClick={() => {
            const params = new URLSearchParams({ workspaceId, limit });
            if (entityType) params.set("entityType", entityType);
            if (entityId) params.set("entityId", entityId);
            window.location.href = `${API_BASE}/audit/export.csv?${params.toString()}`;
          }}
          className="rounded-full border border-gray-200 px-3 py-2 text-xs text-gray-600"
        >
          Download CSV
        </button>
        <button
          type="button"
          onClick={async () => {
            setExportStatus("Exporting...");
            const params = new URLSearchParams({ workspaceId, actorUserId: "demo-user", limit });
            if (entityType) params.set("entityType", entityType);
            if (entityId) params.set("entityId", entityId);
            const res = await fetch(`${API_BASE}/audit/export?${params.toString()}`, { method: "POST", headers: HEADERS });
            if (!res.ok) {
              setExportStatus("Export failed.");
              return;
            }
            const payload = await res.json();
            if (payload?.url) {
              setExportStatus("Export ready. Opening download...");
              window.open(payload.url as string, "_blank");
            } else {
              setExportStatus("Export completed.");
            }
          }}
          className="rounded-full border border-gray-200 px-3 py-2 text-xs text-gray-600"
        >
          Export to storage
        </button>
        <button
          type="button"
          onClick={async () => {
            setRetentionStatus("Running retention...");
            const params = new URLSearchParams({ workspaceId });
            const res = await fetch(`${API_BASE}/audit/retention-run?${params.toString()}`, {
              method: "POST",
              headers: HEADERS,
            });
            setRetentionStatus(res.ok ? "Retention run completed." : "Retention run failed.");
          }}
          className="rounded-full border border-gray-200 px-3 py-2 text-xs text-gray-600"
        >
          Run retention
        </button>
        {exportStatus && <span className="text-xs text-gray-500">{exportStatus}</span>}
        {retentionStatus && <span className="text-xs text-gray-500">{retentionStatus}</span>}
      </div>
      <div className="mt-6 grid gap-4">
        {filteredEvents.length === 0 && (
          <div className="rounded-2xl bg-white p-6 text-sm text-gray-500 shadow-sm">
            No audit events found.
          </div>
        )}
        {filteredEvents.map((event) => (
          <div key={event.id} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">{event.action}</span>
              <span className="text-xs text-gray-400">{new Date(event.createdAt).toLocaleString()}</span>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              {event.entityType} · {event.entityId}
            </p>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
              {event.entityType === "task" && (
                <Link href={`/projects?taskId=${event.entityId}`} className="text-brand-600 hover:underline">
                  Find task
                </Link>
              )}
              {event.entityType === "review" && (
                <Link href={`/insights?reviewId=${event.entityId}`} className="text-brand-600 hover:underline">
                  View reviews
                </Link>
              )}
              {event.entityType === "approval" && (
                <Link href={`/approvals?approvalId=${event.entityId}`} className="text-brand-600 hover:underline">
                  View approval
                </Link>
              )}
            </div>
            {event.metadata && (
              <pre className="mt-2 whitespace-pre-wrap text-sm text-gray-600">
                {JSON.stringify(event.metadata, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
