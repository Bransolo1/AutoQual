"use client";

import React from "react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { API_BASE, HEADERS } from "@/lib/api";

type Approval = {
  id: string;
  linkedEntityType: string;
  linkedEntityId: string;
  status: string;
  requestedByUserId: string;
  decidedByUserId?: string | null;
  decisionNote?: string | null;
  decidedAt?: string | null;
};

export default function ApprovalsPage() {
  const searchParams = useSearchParams();
  const initialFilters = useMemo(() => {
    return {
      linkedEntityId: searchParams.get("linkedEntityId") ?? "demo-study-id",
      approvalId: searchParams.get("approvalId") ?? "",
      status: searchParams.get("status") ?? "",
      type: searchParams.get("linkedEntityType") ?? "",
    };
  }, [searchParams]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [reviewerId, setReviewerId] = useState("");
  const [linkedEntityId, setLinkedEntityId] = useState(initialFilters.linkedEntityId);
  const [approvalId, setApprovalId] = useState(initialFilters.approvalId);
  const [statusFilter, setStatusFilter] = useState(initialFilters.status);
  const [typeFilter, setTypeFilter] = useState(initialFilters.type);
  const [createType, setCreateType] = useState("study");
  const [createEntityId, setCreateEntityId] = useState("");
  const [evidenceGaps, setEvidenceGaps] = useState<Record<string, number>>({});
  const [approvalStatusMessage, setApprovalStatusMessage] = useState("");
  const [createApprovalMessage, setCreateApprovalMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (linkedEntityId) params.set("linkedEntityId", linkedEntityId);
    if (approvalId) params.set("approvalId", approvalId);
    if (statusFilter) params.set("status", statusFilter);
    if (typeFilter) params.set("linkedEntityType", typeFilter);
    fetch(`${API_BASE}/approvals?${params.toString()}`, { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : []))
      .then(setApprovals);
  }, [linkedEntityId, approvalId, statusFilter, typeFilter]);

  useEffect(() => {
    const insightSetIds = Array.from(
      new Set(approvals.filter((approval) => approval.linkedEntityType === "insight_set").map((a) => a.linkedEntityId)),
    );
    if (insightSetIds.length === 0) {
      setEvidenceGaps({});
      return;
    }
    Promise.all(
      insightSetIds.map(async (studyId) => {
        const res = await fetch(`${API_BASE}/analysis/study/${studyId}/evidence-coverage`, { headers: HEADERS });
        if (!res.ok) return [studyId, 0] as const;
        const payload = (await res.json()) as { gapCount?: number };
        return [studyId, payload.gapCount ?? 0] as const;
      }),
    )
      .then((entries) => setEvidenceGaps(Object.fromEntries(entries)))
      .catch(() => undefined);
  }, [approvals]);

  const refreshApprovals = async () => {
    const params = new URLSearchParams();
    if (linkedEntityId) params.set("linkedEntityId", linkedEntityId);
    if (approvalId) params.set("approvalId", approvalId);
    if (statusFilter) params.set("status", statusFilter);
    if (typeFilter) params.set("linkedEntityType", typeFilter);
    const refreshed = await fetch(`${API_BASE}/approvals?${params.toString()}`, { headers: HEADERS });
    setApprovals(refreshed.ok ? await refreshed.json() : []);
  };

  const resubmitDeliverablePack = async (studyId: string) => {
    if (!studyId) return;
    await fetch(`${API_BASE}/approvals`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...HEADERS },
      body: JSON.stringify({
        linkedEntityType: "deliverable_pack",
        linkedEntityId: studyId,
        status: "requested",
        requestedByUserId: "demo-user",
        workspaceId: "demo-workspace-id",
        actorUserId: "demo-user",
      }),
    });
    await refreshApprovals();
  };

  const updateStatus = async (id: string, status: "approved" | "rejected") => {
    const res = await fetch(`${API_BASE}/approvals/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...HEADERS },
      body: JSON.stringify({
        status,
        decidedByUserId: "demo-approver",
        decisionNote: `${status} via UI`,
        workspaceId: "demo-workspace-id",
        actorUserId: "demo-user",
      }),
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      const message =
        typeof payload?.message === "string"
          ? payload.message
          : "Unable to update approval status.";
      setApprovalStatusMessage(message);
      return;
    }
    setApprovalStatusMessage("");
    await refreshApprovals();
  };

  return (
    <main className="min-h-screen px-8 py-10">
      <h1 className="text-2xl font-semibold">Approvals</h1>
      <div className="mt-4 flex flex-wrap gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <input
          value={linkedEntityId}
          onChange={(e) => setLinkedEntityId(e.target.value)}
          placeholder="Linked entity ID"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        <input
          value={approvalId}
          onChange={(e) => setApprovalId(e.target.value)}
          placeholder="Approval ID"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="requested">Requested</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="">All types</option>
          <option value="study">Study</option>
          <option value="report">Report</option>
          <option value="insight_set">Insight set</option>
          <option value="milestone">Milestone</option>
          <option value="deliverable_pack">Deliverable pack</option>
        </select>
      </div>
      <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
        Evidence requirements: insight set approvals require clips or transcript spans for every insight. Approvals will
        be blocked if evidence is missing.
      </div>
      {approvalStatusMessage && (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
          {approvalStatusMessage}
        </div>
      )}
      <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold">Create approval</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <select
            value={createType}
            onChange={(e) => {
              setCreateType(e.target.value);
              setCreateApprovalMessage("");
            }}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="study">Study</option>
            <option value="report">Report</option>
            <option value="insight_set">Insight set</option>
            <option value="milestone">Milestone</option>
            <option value="deliverable_pack">Deliverable pack</option>
          </select>
          <input
            value={createEntityId}
            onChange={(e) => {
              setCreateEntityId(e.target.value);
              setCreateApprovalMessage("");
            }}
            placeholder="Linked entity ID"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={async () => {
              if (!createEntityId.trim()) return;
              const res = await fetch(`${API_BASE}/approvals`, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...HEADERS },
                body: JSON.stringify({
                  linkedEntityType: createType,
                  linkedEntityId: createEntityId.trim(),
                  status: "requested",
                  requestedByUserId: "demo-user",
                  workspaceId: "demo-workspace-id",
                  actorUserId: "demo-user",
                }),
              });
              if (!res.ok) {
                const payload = await res.json().catch(() => null);
                const message =
                  typeof payload?.message === "string"
                    ? payload.message
                    : "Unable to create approval.";
                setCreateApprovalMessage(message);
                return;
              }
              setCreateEntityId("");
              setCreateApprovalMessage("");
              await refreshApprovals();
            }}
            className="rounded-full bg-brand-500 px-4 py-2 text-sm font-medium text-white"
          >
            Create approval
          </button>
        </div>
        {createApprovalMessage && (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
            {createApprovalMessage}
          </div>
        )}
      </div>
      <div className="mt-6 grid gap-4">
        {approvals.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-5 text-sm text-slate-600">
            No approvals yet. If an insight set is blocked, review evidence coverage in the Analysis Quality panel on
            the{" "}
            <a href="/studies" className="text-brand-600 hover:underline">
              Studies page
            </a>
            .
          </div>
        )}
        {approvals.map((approval) => (
          <div key={approval.id} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {approval.linkedEntityType === "deliverable_pack"
                  ? "Deliverable pack"
                  : approval.linkedEntityType}
              </h2>
              <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700">
                {approval.status}
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Entity: {approval.linkedEntityId} · Requested by {approval.requestedByUserId}
            </p>
            {approval.linkedEntityType === "insight_set" && (
              <p className="mt-1 text-xs text-amber-700">
                Evidence gaps: {evidenceGaps[approval.linkedEntityId] ?? 0}
              </p>
            )}
            {approval.linkedEntityType === "deliverable_pack" && (
              <p className="mt-1 text-xs text-gray-500">
                Deliverables:{" "}
                <a
                  href={`/client/reports?studyId=${approval.linkedEntityId}`}
                  className="text-brand-600 hover:underline"
                >
                  View pack →
                </a>
              </p>
            )}
            {approval.decidedAt && (
              <p className="mt-1 text-xs text-gray-400">
                Decision: {approval.status} · {approval.decidedByUserId ?? "unknown"} ·{" "}
                {new Date(approval.decidedAt).toLocaleString()}
              </p>
            )}
            {approval.decisionNote && (
              <p className="mt-1 text-xs text-gray-500">Note: {approval.decisionNote}</p>
            )}
            {approval.status === "requested" && (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => updateStatus(approval.id, "approved")}
                  disabled={
                    approval.linkedEntityType === "insight_set" &&
                    (evidenceGaps[approval.linkedEntityId] ?? 0) > 0
                  }
                  className="rounded-full bg-green-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => updateStatus(approval.id, "rejected")}
                  className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white"
                >
                  Reject
                </button>
                {approval.linkedEntityType === "insight_set" && (
                  <>
                    {evidenceGaps[approval.linkedEntityId] > 0 && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                        Evidence gaps detected ({evidenceGaps[approval.linkedEntityId]}). Add clips or transcript spans
                        before approving.
                      </div>
                    )}
                    <input
                      value={reviewerId}
                      onChange={(e) => setReviewerId(e.target.value)}
                      placeholder="Reviewer ID"
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        if (!reviewerId) return;
                        await fetch(`${API_BASE}/reviews/${approval.linkedEntityId}/assign`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json", ...HEADERS },
                          body: JSON.stringify({
                            reviewerId,
                            workspaceId: "demo-workspace-id",
                            actorUserId: "demo-user",
                          }),
                        });
                      }}
                      className="rounded-full border border-brand-500 px-4 py-2 text-sm font-medium text-brand-600"
                    >
                      Assign reviewer
                    </button>
                  </>
                )}
              </div>
            )}
            {approval.status === "rejected" && approval.linkedEntityType === "deliverable_pack" && (
              <button
                type="button"
                onClick={() => resubmitDeliverablePack(approval.linkedEntityId)}
                className="mt-3 rounded-full border border-brand-500 px-4 py-2 text-sm font-medium text-brand-600"
              >
                Resubmit deliverable pack
              </button>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
