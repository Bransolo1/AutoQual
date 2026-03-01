"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const HEADERS = { "x-workspace-id": "demo-workspace-id", "x-user-id": "demo-user" };

type OverdueTask = {
  id: string;
  title: string;
  assigneeUserId?: string | null;
  dueDate: string;
  projectId: string;
};

type Dashboard = {
  overdueTaskDetails: OverdueTask[];
};

export default function OverdueTasksPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const params = new URLSearchParams({ workspaceId: "demo-workspace-id" });
    if (assigneeFilter) params.set("assigneeUserId", assigneeFilter);
    if (query) params.set("q", query);
    fetch(`${API_BASE}/ops/overdue?${params.toString()}`, { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : []))
      .then((overdueTaskDetails) => setData({ overdueTaskDetails }));
  }, [assigneeFilter, query]);

  if (!data) return <main className="p-8">Loading…</main>;

  return (
    <main className="min-h-screen px-8 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Overdue Tasks</h1>
        <Link href="/ops" className="text-brand-600 hover:underline">
          Back to Ops
        </Link>
      </div>
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by task title"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <input
            value={assigneeFilter}
            onChange={(event) => setAssigneeFilter(event.target.value)}
            placeholder="Filter by assignee ID"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <a
            href={`${API_BASE}/ops/overdue.csv?workspaceId=demo-workspace-id&assigneeUserId=${encodeURIComponent(
              assigneeFilter,
            )}&q=${encodeURIComponent(query)}`}
            className="rounded-full border border-brand-500 px-4 py-2 text-sm font-medium text-brand-600"
          >
            Export CSV
          </a>
        </div>
      </div>
      <div className="mt-6 grid gap-4">
        {data.overdueTaskDetails.length === 0 && (
          <div className="rounded-2xl bg-white p-6 text-sm text-gray-500 shadow-sm">
            No overdue tasks match these filters.
          </div>
        )}
        {data.overdueTaskDetails.map((task) => (
          <div key={task.id} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <Link href={`/projects/${task.projectId}`} className="text-lg font-semibold text-brand-600 hover:underline">
                {task.title}
              </Link>
              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                Overdue
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Due {new Date(task.dueDate).toLocaleDateString()} ·{" "}
              {task.assigneeUserId ? `Assignee ${task.assigneeUserId}` : "Unassigned"}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
