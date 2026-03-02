"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { API_BASE, HEADERS } from "@/lib/api";

type BlockedTask = {
  id: string;
  title: string;
  blockedReason?: string | null;
  blockedByTaskId?: string | null;
  dueDate: string;
  projectId: string;
  assigneeUserId?: string | null;
};

export default function BlockedTasksPage() {
  const [tasks, setTasks] = useState<BlockedTask[]>([]);
  const [query, setQuery] = useState("");

  const refreshTasks = () => {
    const params = new URLSearchParams({ workspaceId: "demo-workspace-id" });
    if (query) params.set("q", query);
    fetch(`${API_BASE}/ops/blocked?${params.toString()}`, { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : []))
      .then(setTasks);
  };

  useEffect(() => {
    refreshTasks();
  }, [query]);

  return (
    <main className="min-h-screen px-8 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Blocked Tasks</h1>
        <Link href="/ops" className="text-brand-600 hover:underline">
          Back to Ops
        </Link>
      </div>
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by title or blocker reason"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <a
            href={`${API_BASE}/ops/blocked.csv?workspaceId=demo-workspace-id&q=${encodeURIComponent(query)}`}
            className="rounded-full border border-brand-500 px-4 py-2 text-sm font-medium text-brand-600"
          >
            Export CSV
          </a>
        </div>
      </div>
      <div className="mt-6 grid gap-4">
        {tasks.length === 0 && (
          <div className="rounded-2xl bg-white p-6 text-sm text-gray-500 shadow-sm">
            No blocked tasks match these filters.
          </div>
        )}
        {tasks.map((task) => (
          <div key={task.id} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <Link href={`/projects/${task.projectId}`} className="text-lg font-semibold text-brand-600 hover:underline">
                {task.title}
              </Link>
              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                Blocked
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Due {new Date(task.dueDate).toLocaleDateString()} ·{" "}
              {task.assigneeUserId ? `Assignee ${task.assigneeUserId}` : "Unassigned"}
            </p>
            {task.blockedReason && (
              <p className="mt-2 text-xs text-red-600">
                Blocked: {task.blockedReason}
                {task.blockedByTaskId && ` · Task ${task.blockedByTaskId}`}
              </p>
            )}
            <button
              type="button"
              onClick={async () => {
                if (task.blockedByTaskId) {
                  const depRes = await fetch(`${API_BASE}/tasks/${task.blockedByTaskId}`, { headers: HEADERS });
                  if (depRes.ok) {
                    const dep = await depRes.json();
                    if (dep.status !== "done") {
                      window.alert("Blocking task is not done yet.");
                      return;
                    }
                  }
                }
                await fetch(`${API_BASE}/tasks/${task.id}/status`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json", ...HEADERS },
                  body: JSON.stringify({
                    status: "in_progress",
                    workspaceId: "demo-workspace-id",
                    actorUserId: "demo-user",
                  }),
                });
                refreshTasks();
              }}
              className="mt-3 rounded-full border border-emerald-500 px-3 py-1 text-xs font-medium text-emerald-600"
            >
              Mark unblocked
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
