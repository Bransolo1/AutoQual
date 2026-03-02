"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const HEADERS = { "x-workspace-id": "demo-workspace-id", "x-user-id": "demo-user" };

type AlertEvent = {
  id: string;
  type: string;
  severity: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

type AlertView = {
  id: string;
  name: string;
  filters: Record<string, unknown>;
  createdAt: string;
};

export default function OpsAlertsPage() {
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [filter, setFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [views, setViews] = useState<AlertView[]>([]);
  const [selectedViewId, setSelectedViewId] = useState("");
  const [viewName, setViewName] = useState("");
  const [viewStatus, setViewStatus] = useState<string | null>(null);

  const loadAlerts = async () => {
    const params = new URLSearchParams({ workspaceId: "demo-workspace-id", limit: "200" });
    if (filter !== "all") params.set("severity", filter);
    if (typeFilter.trim()) params.set("type", typeFilter.trim());
    if (fromDate) params.set("from", new Date(fromDate).toISOString());
    if (toDate) params.set("to", new Date(toDate).toISOString());
    const res = await fetch(`${API_BASE}/alerts?${params.toString()}`, { headers: HEADERS });
    setAlerts(res.ok ? await res.json() : []);
  };

  const loadViews = async () => {
    const res = await fetch(`${API_BASE}/alerts/views?workspaceId=demo-workspace-id`, { headers: HEADERS });
    setViews(res.ok ? await res.json() : []);
  };

  const exportUrl = (() => {
    const params = new URLSearchParams({ workspaceId: "demo-workspace-id" });
    if (filter !== "all") params.set("severity", filter);
    if (typeFilter.trim()) params.set("type", typeFilter.trim());
    if (fromDate) params.set("from", new Date(fromDate).toISOString());
    if (toDate) params.set("to", new Date(toDate).toISOString());
    return `${API_BASE}/alerts/export.csv?${params.toString()}`;
  })();

  useEffect(() => {
    void loadAlerts();
  }, [filter, typeFilter, fromDate, toDate]);

  useEffect(() => {
    void loadViews();
  }, []);

  useEffect(() => {
    if (!selectedViewId) return;
    const selected = views.find((view) => view.id === selectedViewId);
    if (!selected) return;
    const filters = selected.filters ?? {};
    setFilter((filters.severity as string) ?? "all");
    setTypeFilter((filters.type as string) ?? "");
    setFromDate((filters.fromDate as string) ?? "");
    setToDate((filters.toDate as string) ?? "");
  }, [selectedViewId, views]);

  return (
    <main className="min-h-screen px-8 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Alert history</h1>
          <p className="mt-2 text-sm text-gray-600">Audit of adoption and delivery alerts.</p>
        </div>
        <Link href="/ops" className="text-brand-600 hover:underline">Back to Ops</Link>
      </div>
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-gray-500">Alerts</h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
              <button
                type="button"
                onClick={() => {
                  setFilter("warning");
                  setTypeFilter("activation.low_views");
                  const start = new Date(Date.now() - 28 * 86400000);
                  setFromDate(start.toISOString().slice(0, 10));
                  setToDate(new Date().toISOString().slice(0, 10));
                }}
                className="rounded-full border border-gray-200 px-3 py-1 text-[11px] text-gray-600"
              >
                Low activation (28d)
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilter("warning");
                  setTypeFilter("feedback.low_score");
                  const start = new Date(Date.now() - 28 * 86400000);
                  setFromDate(start.toISOString().slice(0, 10));
                  setToDate(new Date().toISOString().slice(0, 10));
                }}
                className="rounded-full border border-gray-200 px-3 py-1 text-[11px] text-gray-600"
              >
                Low feedback (28d)
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilter("critical");
                  setTypeFilter("delivery.risk");
                  const start = new Date(Date.now() - 7 * 86400000);
                  setFromDate(start.toISOString().slice(0, 10));
                  setToDate(new Date().toISOString().slice(0, 10));
                }}
                className="rounded-full border border-gray-200 px-3 py-1 text-[11px] text-gray-600"
              >
                Delivery risk (7d)
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilter("all");
                  setTypeFilter("");
                  setFromDate("");
                  setToDate("");
                  setSelectedViewId("");
                }}
                className="rounded-full border border-gray-200 px-3 py-1 text-[11px] text-gray-600"
              >
                Clear filters
              </button>
            </div>
            <select
              value={selectedViewId}
              onChange={(event) => setSelectedViewId(event.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="">Saved views</option>
              {views.map((view) => (
                <option key={view.id} value={view.id}>
                  {view.name}
                </option>
              ))}
            </select>
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="all">All severities</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
            <input
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              placeholder="Filter by type"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <a
              href={exportUrl}
              className="rounded-full border border-brand-500 px-3 py-1 text-[11px] font-medium text-brand-600"
            >
              Export CSV
            </a>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <input
            value={viewName}
            onChange={(event) => setViewName(event.target.value)}
            placeholder="Save current filters as view"
            className="w-60 rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={async () => {
              if (!viewName.trim()) return;
              setViewStatus("Saving...");
              const res = await fetch(`${API_BASE}/alerts/views`, {
                method: "POST",
                headers: { ...HEADERS, "Content-Type": "application/json" },
                body: JSON.stringify({
                  workspaceId: "demo-workspace-id",
                  name: viewName.trim(),
                  createdByUserId: "demo-user",
                  filters: {
                    severity: filter === "all" ? null : filter,
                    type: typeFilter.trim() || null,
                    fromDate: fromDate || null,
                    toDate: toDate || null,
                  },
                }),
              });
              setViewStatus(res.ok ? "View saved." : "Failed to save view.");
              if (res.ok) {
                setViewName("");
                await loadViews();
              }
            }}
            className="rounded-full border border-brand-500 px-3 py-1 text-[11px] font-medium text-brand-600"
          >
            Save view
          </button>
          {selectedViewId && (
            <button
              type="button"
              onClick={async () => {
                setViewStatus("Deleting...");
                const res = await fetch(`${API_BASE}/alerts/views/${selectedViewId}`, {
                  method: "DELETE",
                  headers: HEADERS,
                });
                setViewStatus(res.ok ? "View deleted." : "Failed to delete view.");
                if (res.ok) {
                  setSelectedViewId("");
                  await loadViews();
                }
              }}
              className="rounded-full border border-gray-200 px-3 py-1 text-[11px] font-medium text-gray-600"
            >
              Delete view
            </button>
          )}
          {viewStatus && <span className="text-[11px] text-gray-500">{viewStatus}</span>}
        </div>
        <ul className="mt-4 space-y-2 text-sm text-gray-700">
          {alerts.map((alert) => (
            <li key={alert.id} className="rounded-lg border border-gray-100 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs uppercase text-gray-500">{alert.type}</span>
                <span className="text-xs text-gray-500">{new Date(alert.createdAt).toLocaleString()}</span>
              </div>
              <div className="mt-1 text-sm text-gray-700">Severity: {alert.severity}</div>
              <div className="mt-2 text-xs text-gray-500">
                Payload: {JSON.stringify(alert.payload)}
              </div>
            </li>
          ))}
          {alerts.length === 0 && <li className="text-sm text-gray-500">No alerts yet.</li>}
        </ul>
      </div>
    </main>
  );
}
