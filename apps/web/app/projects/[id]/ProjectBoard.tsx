"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { TaskDrawer } from "../../../components/TaskDrawer";
import { useApi } from "../../lib/use-api";

const columns = [
  { id: "todo", title: "To Do" },
  { id: "in_progress", title: "In Progress" },
  { id: "blocked", title: "Blocked" },
  { id: "done", title: "Done" },
];

type TaskCard = {
  id: string;
  title: string;
  status: string;
  assigneeUserId?: string | null;
  blockedReason?: string | null;
  blockedByTaskId?: string | null;
};

export function ProjectBoard({
  tasks,
  onStatusChange,
}: {
  tasks: TaskCard[];
  onStatusChange?: () => void;
}) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const taskId = searchParams?.get("taskId");
    if (!taskId) return;
    if (!tasks.some((task) => task.id === taskId)) return;
    setSelectedTaskId(taskId);
  }, [searchParams, tasks]);

  const clearTaskParam = () => {
    if (!searchParams?.get("taskId")) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("taskId");
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname);
  };

  const byStatus = (status: string) =>
    tasks.filter((t) => t.status === status);

  const updateStatus = async (taskId: string, status: string) => {
    let blockedReason: string | null = null;
    let blockedByTaskId: string | null = null;
    if (status === "blocked") {
      blockedReason = window.prompt("Blocker reason (required)")?.trim() ?? null;
      if (!blockedReason) return;
      blockedByTaskId = window.prompt("Blocking task ID (optional)")?.trim() || null;
    } else {
      blockedReason = null;
      blockedByTaskId = null;
    }
    if (status === "done") {
      const res = await apiFetch(`/tasks/${taskId}`));
      if (res.ok) {
        const task = await res.json();
        const deps = (task.dependencies ?? []) as string[];
        if (deps.length) {
          const depChecks = await Promise.all(
            deps.map((depId) => apiFetch(`/tasks/${depId}`))),
          );
          const depStatuses = await Promise.all(depChecks.map((r) => (r.ok ? r.json() : null)));
          const incomplete = depStatuses.filter((d) => d && d.status !== "done");
          if (incomplete.length) {
            window.alert("Cannot mark done: dependency tasks are not complete.");
            return;
          }
        }
      }
    }
    await apiFetch(`/tasks/${taskId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...HEADERS },
      body: JSON.stringify({
        status,
        workspaceId: user?.workspaceId ?? "",
        actorUserId: user?.sub ?? "",
        blockedReason,
        blockedByTaskId,
      }),
    }).then(async (res) => {
      if (!res.ok) {
        const text = await res.text();
        if (text.includes("dependencies_incomplete")) {
          setStatusError("Dependencies must be complete before marking done.");
        } else if (text.includes("blocked_reason_required")) {
          setStatusError("Blocked tasks require a reason.");
        } else {
          setStatusError("Failed to update task status.");
        }
        return;
      }
      setStatusError(null);
    });
    onStatusChange?.();
  };

  return (
    <>
      <section className="mt-8">
        <h2 className="text-lg font-semibold">Delivery Board</h2>
        {statusError && (
          <div className="mt-3 rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">
            {statusError}
          </div>
        )}
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          {columns.map((col) => (
            <div key={col.id} className="rounded-2xl bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold">{col.title}</h3>
              <div className="mt-3 space-y-3">
                {byStatus(col.id).map((task) => (
                  <div
                    key={task.id}
                    className="w-full rounded-xl border border-gray-100 p-3 text-left transition hover:border-brand-200 hover:bg-brand-50"
                  >
                    <button type="button" onClick={() => setSelectedTaskId(task.id)} className="w-full text-left">
                      <p className="text-sm font-medium">{task.title}</p>
                      {task.assigneeUserId && (
                        <p className="mt-2 text-xs text-gray-500">Assignee: {task.assigneeUserId}</p>
                      )}
                      {task.status === "blocked" && task.blockedReason && (
                        <p className="mt-2 text-xs text-red-600">
                          Blocked: {task.blockedReason}
                          {task.blockedByTaskId && ` · Task ${task.blockedByTaskId}`}
                        </p>
                      )}
                    </button>
                    <select
                      value={task.status}
                      onChange={(event) => updateStatus(task.id, event.target.value)}
                      className="mt-3 w-full rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-600"
                    >
                      <option value="todo">To do</option>
                      <option value="in_progress">In progress</option>
                      <option value="blocked">Blocked</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
      <TaskDrawer
        taskId={selectedTaskId}
        onClose={() => {
          setSelectedTaskId(null);
          clearTaskParam();
        }}
      />
    </>
  );
}
