"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ProjectBoard } from "./ProjectBoard";
import { API_BASE, HEADERS } from "@/lib/api";

type Project = {
  id: string;
  name: string;
  description: string;
  status: string;
  clientOrgName: string;
  milestones: { id: string; name: string; status: string; orderIndex: number }[];
  tasks: {
    id: string;
    title: string;
    status: string;
    assigneeUserId?: string | null;
    dependencies?: string[];
  }[];
};

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const [project, setProject] = useState<Project | null>(null);
  const [activity, setActivity] = useState<
    { id: string; type: string; payload: Record<string, unknown>; createdAt: string }[]
  >([]);
  const [dependencyOrder, setDependencyOrder] = useState<
    { id: string; title: string; status: string; blockedReason?: string | null; blockedByTaskId?: string | null }[]
  >([]);
  const [auditEvents, setAuditEvents] = useState<
    { id: string; action: string; entityType: string; entityId: string; createdAt: string; metadata?: Record<string, unknown> }[]
  >([]);
  const [showNewTask, setShowNewTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskStatus, setTaskStatus] = useState("todo");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [taskDueDate, setTaskDueDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().slice(0, 10);
  });
  const [taskMilestoneId, setTaskMilestoneId] = useState<string>("");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [taskReviewer, setTaskReviewer] = useState("");
  const [taskDependencies, setTaskDependencies] = useState("");

  useEffect(() => {
    if (!id) return;
    fetch(`${API_BASE}/projects/${id}`, { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : null))
      .then(setProject);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetch(`${API_BASE}/notifications?userId=demo-user&limit=25`, { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const filtered = (data as { id: string; type: string; payload: Record<string, unknown>; createdAt: string }[])
          .filter((item) => (item.payload as { projectId?: string }).projectId === id)
          .slice(0, 8);
        setActivity(filtered);
      });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetch(`${API_BASE}/tasks/dependency-order?projectId=${id}`, { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setDependencyOrder(data ?? []));
  }, [id]);

  useEffect(() => {
    if (!project) return;
    const taskIds = new Set((project.tasks ?? []).map((task) => task.id));
    fetch(`${API_BASE}/audit?workspaceId=demo-workspace-id&limit=50`, { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const filtered = (data as {
          id: string;
          action: string;
          entityType: string;
          entityId: string;
          createdAt: string;
          metadata?: Record<string, unknown>;
        }[])
          .filter((event) => event.entityType === "task" && taskIds.has(event.entityId))
          .slice(0, 8);
        setAuditEvents(filtered);
      });
  }, [project]);

  if (!id) return <main className="p-8">Invalid project</main>;
  if (!project) return <main className="p-8">Loading…</main>;

  const refreshProject = async () => {
    const response = await fetch(`${API_BASE}/projects/${id}`, { headers: HEADERS });
    setProject(response.ok ? await response.json() : null);
  };

  const createTask = async () => {
    if (!taskTitle.trim()) return;
    await fetch(`${API_BASE}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...HEADERS },
      body: JSON.stringify({
        projectId: id,
        milestoneId: taskMilestoneId || null,
        title: taskTitle.trim(),
        description: taskDescription.trim(),
        status: taskStatus,
        priority: taskPriority,
        assigneeUserId: taskAssignee || null,
        reviewerUserId: taskReviewer || null,
        workspaceId: "demo-workspace-id",
        actorUserId: "demo-user",
        dueDate: new Date(taskDueDate).toISOString(),
        dependencies: taskDependencies
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
      }),
    });
    setShowNewTask(false);
    setTaskTitle("");
    setTaskDescription("");
    setTaskStatus("todo");
    setTaskPriority("medium");
    setTaskMilestoneId("");
    setTaskAssignee("");
    setTaskReviewer("");
    setTaskDependencies("");
    await refreshProject();
  };

  return (
    <main className="min-h-screen px-8 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          <p className="mt-2 text-sm text-gray-600">Client: {project.clientOrgName}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowNewTask(true)}
          className="rounded-full bg-brand-500 px-4 py-2 text-sm font-medium text-white"
        >
          New Task
        </button>
      </div>

      <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Milestone Timeline</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {(project.milestones ?? []).slice(0, 8).map((m) => (
            <div key={m.id} className="rounded-xl border border-gray-100 p-4">
              <p className="text-sm font-medium">{m.name}</p>
              <p className="mt-2 text-xs text-gray-500">{m.status}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
        <p className="mt-2 text-sm text-gray-600">Project-level assignments and approvals.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {activity.length === 0 && (
            <div className="rounded-xl border border-gray-100 p-4 text-sm text-gray-500">
              No activity for this project yet.
            </div>
          )}
          {activity.map((item) => (
            <div key={item.id} className="rounded-xl border border-gray-100 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">{item.type}</span>
                <span className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleString()}</span>
              </div>
              <pre className="mt-2 whitespace-pre-wrap text-sm text-gray-600">
                {JSON.stringify(item.payload, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Dependency Order</h2>
        <p className="mt-2 text-sm text-gray-600">Critical path based on task dependencies.</p>
        <ol className="mt-4 space-y-2">
          {dependencyOrder.length === 0 && (
            <li className="text-sm text-gray-500">No dependencies configured.</li>
          )}
          {dependencyOrder.map((task, index) => (
            <li key={task.id} className="flex flex-wrap items-center gap-3 text-sm text-gray-700">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                {index + 1}
              </span>
              <span>{task.title}</span>
              <span className="rounded-full bg-gray-100 px-2 py-1 text-[11px] text-gray-600">{task.status}</span>
              {task.status === "blocked" && task.blockedReason && (
                <span className="text-xs text-red-600">
                  Blocked: {task.blockedReason}
                  {task.blockedByTaskId && ` · Task ${task.blockedByTaskId}`}
                </span>
              )}
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Audit Trail</h2>
        <p className="mt-2 text-sm text-gray-600">Recent task changes in this project.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {auditEvents.length === 0 && (
            <div className="rounded-xl border border-gray-100 p-4 text-sm text-gray-500">
              No recent audit events.
            </div>
          )}
          {auditEvents.map((event) => (
            <div key={event.id} className="rounded-xl border border-gray-100 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">{event.action}</span>
                <span className="text-xs text-gray-400">{new Date(event.createdAt).toLocaleString()}</span>
              </div>
              <div className="mt-2 text-xs text-gray-500">Task: {event.entityId}</div>
              {event.metadata && (
                <pre className="mt-2 whitespace-pre-wrap text-sm text-gray-600">
                  {JSON.stringify(event.metadata, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Dependency Map</h2>
        <p className="mt-2 text-sm text-gray-600">Tasks with their upstream blockers.</p>
        <div className="mt-4 space-y-3">
          {(project.tasks ?? []).map((task) => (
            <div key={task.id} className="rounded-xl border border-gray-100 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-semibold">{task.title}</span>
                <span className="rounded-full bg-gray-100 px-2 py-1 text-[11px] text-gray-600">
                  {task.status}
                </span>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Depends on: {(task.dependencies ?? []).length ? task.dependencies?.join(", ") : "None"}
              </div>
            </div>
          ))}
        </div>
      </section>

      <ProjectBoard tasks={project.tasks ?? []} onStatusChange={refreshProject} />

      {showNewTask && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setShowNewTask(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Create task</h2>
                <button
                  type="button"
                  onClick={() => setShowNewTask(false)}
                  className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
                  aria-label="Close"
                >
                  <span className="text-xl leading-none">&times;</span>
                </button>
              </div>
              <div className="mt-4 grid gap-3">
                <input
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Task title"
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
                <textarea
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Description"
                  className="min-h-[100px] rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
                <div className="grid gap-3 md:grid-cols-2">
                  <select
                    value={taskStatus}
                    onChange={(e) => setTaskStatus(e.target.value)}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  >
                    <option value="todo">To do</option>
                    <option value="in_progress">In progress</option>
                    <option value="blocked">Blocked</option>
                    <option value="done">Done</option>
                  </select>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                  <select
                    value={taskMilestoneId}
                    onChange={(e) => setTaskMilestoneId(e.target.value)}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  >
                    <option value="">No milestone</option>
                    {(project.milestones ?? []).map((milestone) => (
                      <option key={milestone.id} value={milestone.id}>
                        {milestone.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    placeholder="Assignee user ID"
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                  <input
                    value={taskReviewer}
                    onChange={(e) => setTaskReviewer(e.target.value)}
                    placeholder="Reviewer user ID"
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
                <input
                  value={taskDependencies}
                  onChange={(e) => setTaskDependencies(e.target.value)}
                  placeholder="Dependency task IDs (comma separated)"
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewTask(false)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={createTask}
                  className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white"
                >
                  Create task
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
