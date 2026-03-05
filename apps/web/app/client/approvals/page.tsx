"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API_BASE, CLIENT_HEADERS as HEADERS } from "@/lib/api";

type Approval = {
  id: string;
  linkedEntityType: string;
  linkedEntityId: string;
  status: string;
  decidedByUserId?: string | null;
  decidedAt?: string | null;
};

export default function ClientApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [statusFilter, setStatusFilter] = useState("requested");

  useEffect(() => {
    const params = new URLSearchParams({ status: statusFilter });
    fetch(`${API_BASE}/approvals?${params.toString()}`, { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : []))
      .then(setApprovals);
  }, [statusFilter]);

  return (
    <main className="min-h-screen px-8 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Client Approvals</h1>
        <Link href="/client" className="text-brand-600 hover:underline">
          Back to portal
        </Link>
      </div>
      <p className="mt-2 text-sm text-gray-600">Review approval requests and decisions.</p>
      <div className="mt-4 flex flex-wrap gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="requested">Requested</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
      <div className="mt-6 grid gap-4">
        {approvals.length === 0 && (
          <div className="rounded-2xl bg-white p-6 text-sm text-gray-500 shadow-sm">
            No approvals found.
          </div>
        )}
        {approvals.map((approval) => (
          <div key={approval.id} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">
                {approval.linkedEntityType === "deliverable_pack"
                  ? "deliverable pack"
                  : approval.linkedEntityType}
              </span>
              <span
                className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                  approval.status === "approved"
                    ? "bg-emerald-100 text-emerald-700"
                    : approval.status === "rejected"
                      ? "bg-rose-100 text-rose-700"
                      : "bg-amber-100 text-amber-700"
                }`}
              >
                {approval.status}
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              {approval.linkedEntityType} · {approval.linkedEntityId}
            </p>
            {approval.status === "requested" && (
              <p className="mt-1 text-xs text-gray-500">SLA: 3 business days</p>
            )}
            <Link
              href={`/client/approvals/${approval.id}`}
              className="mt-3 inline-block text-xs text-brand-600 hover:underline"
            >
              View detail →
            </Link>
            {approval.decidedAt && (
              <p className="mt-1 text-xs text-gray-500">
                Decided {new Date(approval.decidedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
