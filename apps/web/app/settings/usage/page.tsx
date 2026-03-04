"use client";
import { useEffect, useState } from "react";
import { useApi } from "../../../lib/use-api";

interface UsageData {
  sessionsThisMonth: number;
  storageBytes: number;
  activeSeats: number;
  dailySessions: { date: string; count: number }[];
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export default function UsagePage() {
  const { apiFetch, user } = useApi();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.workspaceId) return;
    apiFetch(`/workspaces/${user.workspaceId}/usage`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setUsage(data); })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [user?.workspaceId]);

  if (loading) return <div className="p-8 text-slate-500">Loading usage data…</div>;
  if (!usage) return <div className="p-8 text-red-500">Failed to load usage data.</div>;

  const maxCount = Math.max(...usage.dailySessions.map((d) => d.count), 1);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Usage</h1>
        <p className="mt-1 text-sm text-slate-500">Monitor your workspace usage this month.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Sessions this month", value: usage.sessionsThisMonth },
          { label: "Active seats", value: usage.activeSeats },
          { label: "Storage used", value: formatBytes(usage.storageBytes) },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">Daily sessions (last 30 days)</h2>
        {usage.dailySessions.length === 0 ? (
          <p className="text-sm text-slate-400">No sessions recorded in the last 30 days.</p>
        ) : (
          <div className="flex items-end gap-1" style={{ height: 120 }}>
            {usage.dailySessions.map(({ date, count }) => (
              <div
                key={date}
                title={`${date}: ${count} session${count !== 1 ? "s" : ""}`}
                className="flex-1 rounded-t bg-blue-500 hover:bg-blue-600 transition-colors"
                style={{ height: `${Math.round((count / maxCount) * 100)}%`, minHeight: 4 }}
              />
            ))}
          </div>
        )}
      </div>

      <p className="text-center text-sm text-slate-500">
        Need more capacity?{" "}
        <a href="/settings/billing" className="font-medium text-blue-600 hover:underline">
          View your plan
        </a>
      </p>
    </div>
  );
}
