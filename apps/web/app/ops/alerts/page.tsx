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

export default function OpsAlertsPage() {
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch(`${API_BASE}/alerts?workspaceId=demo-workspace-id`, { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : []))
      .then(setAlerts);
  }, []);

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
        </div>
        <ul className="mt-4 space-y-2 text-sm text-gray-700">
          {alerts
            .filter((alert) => filter === "all" || alert.severity === filter)
            .map((alert) => (
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
