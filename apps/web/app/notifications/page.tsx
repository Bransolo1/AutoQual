"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API_BASE, HEADERS } from "@/lib/api";

type Notification = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  readAt?: string | null;
  createdAt: string;
};

const typeLabels: Record<string, string> = {
  "task.assigned": "Task assigned",
  "task.reviewer.assigned": "Reviewer assigned",
  "task.comment": "Task comment",
  "task.overdue": "Task overdue",
  "approval.requested": "Approval requested",
  "approval.decision": "Approval decision",
  "review.assigned": "Review assigned",
  "review.comment": "Review comment",
  "data.quality.flagged": "Data quality flagged",
  "embed.completed": "Interview completed",
};

const getApprovalLink = (notification: Notification) => {
  if (!notification.type.startsWith("approval.")) return null;
  const payload = notification.payload as {
    linkedEntityId?: string;
    linkedEntityType?: string;
      approvalId?: string;
    approvalType?: string;
    reportId?: string;
    studyId?: string;
  };
  const params = new URLSearchParams();
    if (payload.approvalId) params.set("approvalId", payload.approvalId);
  if (payload.linkedEntityId) params.set("linkedEntityId", payload.linkedEntityId);
  if (payload.linkedEntityType) params.set("linkedEntityType", payload.linkedEntityType);
  if (payload.approvalType) params.set("linkedEntityType", payload.approvalType);
  if (payload.reportId) params.set("linkedEntityId", payload.reportId);
  if (payload.studyId && !params.get("linkedEntityId")) params.set("linkedEntityId", payload.studyId);
  params.set("status", "requested");
  return `/approvals?${params.toString()}`;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("unread");

  const loadNotifications = async () => {
    const params = new URLSearchParams({ userId: "demo-user", limit: "50" });
    if (typeFilter) params.set("type", typeFilter);
    if (statusFilter === "unread") params.set("unread", "true");
    if (statusFilter === "read") params.set("unread", "false");
    const response = await fetch(`${API_BASE}/notifications?${params.toString()}`, { headers: HEADERS });
    setNotifications(response.ok ? await response.json() : []);
  };

  useEffect(() => {
    loadNotifications();
  }, [typeFilter, statusFilter]);

  const summary = notifications.reduce(
    (acc, notification) => {
      if (!notification.readAt) {
        acc.unread += 1;
      }
      if (notification.type.startsWith("task.")) {
        acc.tasks += 1;
      }
      if (notification.type.startsWith("approval.")) {
        acc.approvals += 1;
      }
      return acc;
    },
    { unread: 0, tasks: 0, approvals: 0 },
  );

  return (
    <main className="min-h-screen px-8 py-10">
      <h1 className="text-2xl font-semibold">Notifications</h1>
      <p className="mt-2 text-sm text-gray-600">Review task assignments, approvals, and reminders.</p>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-500">Unread</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{summary.unread}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-500">Task activity</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{summary.tasks}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-500">Approvals</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{summary.approvals}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <input
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
          placeholder="Filter by type"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="unread">Unread</option>
          <option value="read">Read</option>
          <option value="all">All</option>
        </select>
        <button
          type="button"
          onClick={loadNotifications}
          className="rounded-full border border-brand-500 px-4 py-2 text-sm font-medium text-brand-600"
        >
          Refresh
        </button>
      </div>
      <div className="mt-6 grid gap-4">
        {notifications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-sm text-gray-500">
            No notifications yet. Activity will appear here as tasks and approvals update.
          </div>
        ) : (
          notifications.map((notification) => (
            <div key={notification.id} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-600">
                {typeLabels[notification.type] ?? notification.type}
              </h2>
              <span className="text-xs text-gray-400">
                {new Date(notification.createdAt).toLocaleString()}
              </span>
            </div>
            <pre className="mt-2 whitespace-pre-wrap text-sm text-gray-600">
              {JSON.stringify(notification.payload, null, 2)}
            </pre>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
              {notification.payload.projectId && (
                <Link
                  href={`/projects/${notification.payload.projectId}`}
                  className="text-brand-600 hover:underline"
                >
                  View project
                </Link>
              )}
              {getApprovalLink(notification) && (
                <Link href={getApprovalLink(notification) ?? "/approvals"} className="text-brand-600 hover:underline">
                  View approvals
                </Link>
              )}
              {notification.payload.taskId && (
                <span>Task ID: {notification.payload.taskId}</span>
              )}
              {notification.type === "task.overdue" && (
                <Link href="/ops/overdue" className="text-brand-600 hover:underline">
                  View overdue list
                </Link>
              )}
              {notification.payload.insightId && (
                <Link
                  href={`/insights/${notification.payload.insightId}`}
                  className="text-brand-600 hover:underline"
                >
                  View insight
                </Link>
              )}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
              <span>{notification.readAt ? "Read" : "Unread"}</span>
              {!notification.readAt && (
                <button
                  type="button"
                  onClick={async () => {
                    await fetch(`${API_BASE}/notifications/${notification.id}/read`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json", ...HEADERS },
                    });
                    await loadNotifications();
                  }}
                  className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600"
                >
                  Mark read
                </button>
              )}
            </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
