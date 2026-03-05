"use client";

import { useEffect, useState } from "react";
import { API_BASE, HEADERS } from "@/lib/api";

type Task = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  assigneeUserId?: string | null;
  reviewerUserId?: string | null;
  blockedReason?: string | null;
  blockedByTaskId?: string | null;
  dependencies?: string[];
  comments?: { id: string; body: string; authorUserId: string; createdAt: string }[];
};

type TaskDrawerProps = {
  taskId: string | null;
  onClose: () => void;
};

export function TaskDrawer({ taskId, onClose }: TaskDrawerProps) {
  const [task, setTask] = useState<Task | null>(null);
  const [comment, setComment] = useState("");
  const [assignee, setAssignee] = useState("");
  const [reviewer, setReviewer] = useState("");
  const [auditEvents, setAuditEvents] = useState<
    { id: string; action: string; createdAt: string; metadata?: Record<string, unknown> }[]
  >([]);
  const [dependencyStatuses, setDependencyStatuses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>("");

  const logShare = async (channel: "link" | "qr" | "copy_id", context?: string) => {
    if (!taskId) return;
    await fetch(`${API_BASE}/tasks/${taskId}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...HEADERS },
      body: JSON.stringify({
        workspaceId: "demo-workspace-id",
        actorUserId: "demo-user",
        channel,
        context: context ?? null,
      }),
    });
  };

  useEffect(() => {
    if (!taskId) {
      setTask(null);
      return;
    }
    setLoading(true);
    fetch(`${API_BASE}/tasks/${taskId}`, { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setTask(data);
        if (data) {
          setAssignee(data.assigneeUserId ?? "");
          setReviewer(data.reviewerUserId ?? "");
        }
      })
      .finally(() => setLoading(false));
  }, [taskId]);

  useEffect(() => {
    if (!task?.dependencies?.length) {
      setDependencyStatuses({});
      return;
    }
    Promise.all(
      task.dependencies.map((depId) =>
        fetch(`${API_BASE}/tasks/${depId}`, { headers: HEADERS }).then((r) => (r.ok ? r.json() : null)),
      ),
    ).then((deps) => {
      const statusMap: Record<string, string> = {};
      deps.forEach((dep, index) => {
        if (dep) {
          statusMap[task.dependencies?.[index] ?? ""] = dep.status;
        }
      });
      setDependencyStatuses(statusMap);
    });
  }, [task?.dependencies]);

  useEffect(() => {
    if (!taskId) {
      setAuditEvents([]);
      return;
    }
    fetch(
      `${API_BASE}/audit?workspaceId=demo-workspace-id&entityType=task&entityId=${taskId}&limit=10`,
      { headers: HEADERS },
    )
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setAuditEvents(data ?? []));
  }, [taskId]);

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskId || !comment.trim()) return;
    fetch(`${API_BASE}/tasks/${taskId}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...HEADERS,
      },
      body: JSON.stringify({ authorUserId: "demo-user", body: comment.trim() }),
    })
      .then((r) => r.json())
      .then(() => {
        setComment("");
        fetch(`${API_BASE}/tasks/${taskId}`, { headers: HEADERS })
          .then((r) => r.json())
          .then(setTask);
      });
  };

  const handleUpdateAssignees = async () => {
    if (!taskId) return;
    const response = await fetch(`${API_BASE}/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...HEADERS },
      body: JSON.stringify({
        assigneeUserId: assignee || null,
        reviewerUserId: reviewer || null,
        workspaceId: "demo-workspace-id",
        actorUserId: "demo-user",
      }),
    });
    if (response.ok) {
      const updated = await response.json();
      setTask(updated);
    }
  };

  if (!taskId) return null;

  const copyDeepLink = async () => {
    if (!taskId || typeof window === "undefined") return;
    if (!navigator?.clipboard) {
      setCopyStatus("Clipboard unavailable");
      setTimeout(() => setCopyStatus(null), 2000);
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.set("taskId", taskId);
    try {
      await navigator.clipboard.writeText(url.toString());
      await logShare("link", "copy_deep_link");
      setCopyStatus("Link copied");
    } catch {
      setCopyStatus("Copy failed");
    }
    setTimeout(() => setCopyStatus(null), 2000);
  };

  const copyTaskId = async () => {
    if (!taskId) return;
    if (!navigator?.clipboard) {
      setCopyStatus("Clipboard unavailable");
      setTimeout(() => setCopyStatus(null), 2000);
      return;
    }
    try {
      await navigator.clipboard.writeText(taskId);
      await logShare("copy_id", "copy_task_id");
      setCopyStatus("Task ID copied");
    } catch {
      setCopyStatus("Copy failed");
    }
    setTimeout(() => setCopyStatus(null), 2000);
  };

  const openShare = () => {
    if (!taskId || typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("taskId", taskId);
    setShareUrl(url.toString());
    setShowShare(true);
    void logShare("qr", "open_share_modal");
  };

  const copyShareReport = async () => {
    if (!navigator?.clipboard) {
      setCopyStatus("Clipboard unavailable");
      setTimeout(() => setCopyStatus(null), 2000);
      return;
    }
    const shared = auditEvents.filter((event) => event.action === "task.shared").slice(0, 10);
    const lines = shared.map((event) => {
      const channel = event.metadata?.channel ? `channel=${String(event.metadata.channel)}` : "";
      const context = event.metadata?.context ? `context=${String(event.metadata.context)}` : "";
      const details = [channel, context].filter(Boolean).join(" ");
      return `${new Date(event.createdAt).toLocaleString()}${details ? ` · ${details}` : ""}`;
    });
    const report = [`Task share history (${taskId})`, ...lines].join("\n");
    try {
      await navigator.clipboard.writeText(report);
      setCopyStatus("Share report copied");
    } catch {
      setCopyStatus("Copy failed");
    }
    setTimeout(() => setCopyStatus(null), 2000);
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} aria-hidden />
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-lg overflow-y-auto bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b bg-white px-6 py-4">
          <h2 className="text-lg font-semibold">Task details</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            <span className="text-xl leading-none">&times;</span>
          </button>
        </div>
        <div className="p-6">
          {loading && <p className="text-sm text-gray-500">Loading…</p>}
          {!loading && task && (
            <>
              <h3 className="text-xl font-semibold">{task.title}</h3>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <button
                  type="button"
                  onClick={copyDeepLink}
                  className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:border-brand-200 hover:text-brand-600"
                >
                  Copy deep link
                </button>
                <button
                  type="button"
                  onClick={copyTaskId}
                  className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:border-brand-200 hover:text-brand-600"
                >
                  Copy task ID
                </button>
                <button
                  type="button"
                  onClick={openShare}
                  className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:border-brand-200 hover:text-brand-600"
                >
                  Open share
                </button>
                {copyStatus && <span className="text-xs text-gray-500">{copyStatus}</span>}
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-brand-600">
                <a href="/projects" className="hover:underline">
                  Project board
                </a>
                <a href="/approvals" className="hover:underline">
                  Approvals
                </a>
              </div>
              <p className="mt-2 text-sm text-gray-600">{task.description}</p>
              <div className="mt-4 flex gap-2">
                <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700">
                  {task.status}
                </span>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">{task.priority}</span>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Due: {new Date(task.dueDate).toLocaleDateString()}
              </p>
              {task.status === "blocked" && task.blockedReason && (
                <div className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
                  Blocked: {task.blockedReason}
                  {task.blockedByTaskId && ` · Task ${task.blockedByTaskId}`}
                </div>
              )}
              {(task.dependencies ?? []).length > 0 && (
                <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                  <div className="font-semibold text-gray-700">Dependencies</div>
                  <ul className="mt-2 space-y-1">
                    {task.dependencies?.map((depId) => (
                      <li key={depId} className="flex items-center gap-2">
                        <span>{depId}</span>
                        {dependencyStatuses[depId] && (
                          <span className="rounded-full bg-white px-2 py-0.5 text-[10px] text-gray-500">
                            {dependencyStatuses[depId]}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <section className="mt-6 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <h4 className="text-sm font-semibold">Ownership</h4>
                <div className="mt-3 grid gap-3">
                  <input
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                    placeholder="Assignee user ID"
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                  <input
                    value={reviewer}
                    onChange={(e) => setReviewer(e.target.value)}
                    placeholder="Reviewer user ID"
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleUpdateAssignees}
                  className="mt-3 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white"
                >
                  Update ownership
                </button>
              </section>

              <section className="mt-6">
                <h4 className="text-sm font-semibold">Comments</h4>
                <ul className="mt-2 space-y-2">
                  {(task.comments ?? []).map((c) => (
                    <li key={c.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm">
                      <p>{c.body}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {c.authorUserId} · {new Date(c.createdAt).toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ul>
                <form onSubmit={handleAddComment} className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add a comment…"
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white"
                  >
                    Post
                  </button>
                </form>
              </section>

              <section className="mt-6">
                <h4 className="text-sm font-semibold">Attachments</h4>
                <p className="mt-2 text-sm text-gray-500">Attachments are listed in the API under linkedEntityId.</p>
              </section>

              <section className="mt-6">
                <h4 className="text-sm font-semibold">Audit Trail</h4>
                {auditEvents.filter((event) => event.action === "task.shared").length > 0 && (
                  <div className="mt-2 rounded-lg border border-brand-100 bg-brand-50 px-3 py-2 text-xs text-brand-700">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Share history</span>
                      <button
                        type="button"
                        onClick={copyShareReport}
                        className="rounded-full border border-brand-200 px-2 py-0.5 text-[10px] text-brand-700 hover:bg-white"
                      >
                        Copy report
                      </button>
                    </div>
                    <ul className="mt-2 space-y-1">
                      {auditEvents
                        .filter((event) => event.action === "task.shared")
                        .slice(0, 3)
                        .map((event) => (
                          <li key={event.id}>
                            Shared
                            {event.metadata?.channel ? ` · ${String(event.metadata.channel)}` : ""}
                            {event.metadata?.context ? ` · ${String(event.metadata.context)}` : ""} ·{" "}
                            {new Date(event.createdAt).toLocaleString()}
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
                <div className="mt-2 space-y-2">
                  {auditEvents.length === 0 && (
                    <p className="text-sm text-gray-500">No audit events yet.</p>
                  )}
                  {auditEvents.map((event) => (
                    <div key={event.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="font-medium uppercase tracking-wide text-brand-600">{event.action}</span>
                        <span>{new Date(event.createdAt).toLocaleString()}</span>
                      </div>
                      {event.metadata && (
                        <pre className="mt-2 whitespace-pre-wrap text-xs text-gray-600">
                          {JSON.stringify(event.metadata, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
      {showShare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Share task</h3>
              <button
                type="button"
                onClick={() => setShowShare(false)}
                className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
                aria-label="Close share modal"
              >
                <span className="text-lg leading-none">&times;</span>
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Use the link or QR code to share this task.
            </p>
            <input
              readOnly
              value={shareUrl}
              className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-700"
            />
            <div className="mt-4 flex items-center justify-between gap-3">
              <img
                src={`https://chart.googleapis.com/chart?cht=qr&chs=160x160&chl=${encodeURIComponent(shareUrl)}`}
                alt="Share QR code"
                className="h-32 w-32 rounded-lg border border-gray-100"
              />
              <div className="flex flex-col gap-2 text-xs text-brand-600">
                <button
                  type="button"
                  onClick={copyDeepLink}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 hover:border-brand-200 hover:text-brand-600"
                >
                  Copy share link
                </button>
                <button
                  type="button"
                  onClick={copyTaskId}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 hover:border-brand-200 hover:text-brand-600"
                >
                  Copy task ID
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
