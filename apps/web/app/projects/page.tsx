"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { API_BASE, HEADERS } from "@/lib/api";

type Project = {
  id: string;
  name: string;
  status: string;
  ownerUserId: string;
  clientOrgName?: string;
  milestones?: { id: string; name: string; status: string; dueDate: string }[];
};

type Approval = {
  id: string;
  linkedEntityType: string;
  linkedEntityId: string;
  status: string;
};

export default function ProjectsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const initialFilters = useMemo(() => {
    return {
      status: searchParams.get("status") ?? "",
      owner: searchParams.get("ownerUserId") ?? "",
      query: searchParams.get("q") ?? "",
    };
  }, [searchParams]);
  const [statusFilter, setStatusFilter] = useState(initialFilters.status);
  const [ownerFilter, setOwnerFilter] = useState(initialFilters.owner);
  const [query, setQuery] = useState(initialFilters.query);
  const taskId = searchParams.get("taskId");

  useEffect(() => {
    const params = new URLSearchParams({ workspaceId: "demo-workspace-id" });
    if (statusFilter) params.set("status", statusFilter);
    if (ownerFilter) params.set("ownerUserId", ownerFilter);
    if (query) params.set("q", query);
    fetch(`${API_BASE}/projects?${params.toString()}`, { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : []))
      .then(setProjects);
  }, [statusFilter, ownerFilter, query]);

  useEffect(() => {
    if (!taskId) return;
    fetch(`${API_BASE}/tasks/${taskId}`, { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : null))
      .then((task) => {
        if (task?.projectId) {
          router.push(`/projects/${task.projectId}`);
        }
      });
  }, [taskId, router]);

  useEffect(() => {
    fetch(`${API_BASE}/approvals?status=requested`, { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : []))
      .then(setApprovals);
  }, []);

  const approvalsByEntity = approvals.reduce<Record<string, number>>((acc, approval) => {
    acc[approval.linkedEntityId] = (acc[approval.linkedEntityId] ?? 0) + 1;
    return acc;
  }, {});

  const getMilestoneHealth = (milestones: Project["milestones"]) => {
    if (!milestones || milestones.length === 0) {
      return { label: "No milestones", tone: "bg-gray-100 text-gray-600", reason: "No milestones defined." };
    }
    const now = new Date();
    const blocked = milestones.some((m) => m.status === "blocked");
    const overdue = milestones.some(
      (m) => new Date(m.dueDate) < now && m.status !== "done",
    );
    if (blocked || overdue) {
      const reasons = [];
      if (blocked) reasons.push("Blocked milestone");
      if (overdue) reasons.push("Overdue milestone");
      return { label: "At risk", tone: "bg-red-100 text-red-700", reason: reasons.join(" · ") };
    }
    const doneCount = milestones.filter((m) => m.status === "done").length;
    return {
      label: `On track · ${doneCount}/${milestones.length} complete`,
      tone: "bg-emerald-100 text-emerald-700",
      reason: "No blocked or overdue milestones.",
    };
  };

  const getNextMilestone = (milestones: Project["milestones"]) => {
    if (!milestones || milestones.length === 0) return null;
    const upcoming = milestones
      .filter((m) => m.status !== "done")
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    return upcoming[0] ?? null;
  };

  return (
    <main className="min-h-screen px-8 py-10">
      <h1 className="text-2xl font-semibold">Projects</h1>
      <p className="mt-2 text-sm text-gray-600">
        Organize your qualitative research studies, track progress, and manage approvals.
      </p>
      <div className="mt-4 flex flex-wrap gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by project or client"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm md:w-64"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="planned">Planned</option>
          <option value="active">Active</option>
          <option value="on_hold">On hold</option>
          <option value="complete">Complete</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <input
          value={ownerFilter}
          onChange={(event) => setOwnerFilter(event.target.value)}
          placeholder="Owner user ID"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
      </div>
      <div className="mt-6 grid gap-4">
        {projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-sm text-gray-500">
            No projects yet. Create a project to start tracking milestones and tasks.
          </div>
        ) : (
          projects.map((project) => (
            <div key={project.id} className="rounded-2xl bg-white p-5 shadow-sm">
            <Link href={`/projects/${project.id}`} className="block">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{project.name}</h2>
                <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700">
                  {project.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-500">Owner ID: {project.ownerUserId}</p>
              {project.clientOrgName && (
                <p className="mt-1 text-xs text-gray-400">Client: {project.clientOrgName}</p>
              )}
            </Link>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {(() => {
                const health = getMilestoneHealth(project.milestones);
                return (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${health.tone}`}
                    title={health.reason}
                  >
                    {health.label}
                  </span>
                );
              })()}
              {approvalsByEntity[project.id] ? (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                  {approvalsByEntity[project.id]} approvals pending
                </span>
              ) : null}
              {(() => {
                const next = getNextMilestone(project.milestones);
                return next ? (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    Next: {next.name} · {new Date(next.dueDate).toLocaleDateString()}
                  </span>
                ) : null;
              })()}
            </div>
            <Link
              href={`/client?projectId=${project.id}`}
              className="mt-3 inline-block text-sm text-brand-600 hover:underline"
            >
              Client view →
            </Link>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
