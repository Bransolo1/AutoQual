"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const HEADERS = { "x-workspace-id": "demo-workspace-id", "x-user-id": "demo-user", "x-role": "client" };

type Approval = {
  id: string;
  linkedEntityType: string;
  linkedEntityId: string;
  status: string;
  decisionNote?: string | null;
  decidedByUserId?: string | null;
  decidedAt?: string | null;
};
type Deliverables = {
  reports: { id: string; type: string; createdAt?: string; downloads: Record<string, string> }[];
  stories: { id: string; title: string; type: string; createdAt?: string; downloads: Record<string, string> }[];
};

export default function ClientApprovalDetailPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const [approval, setApproval] = useState<Approval | null>(null);
  const [decisionNote, setDecisionNote] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [lastDecision, setLastDecision] = useState<string | null>(null);
  const [deliverables, setDeliverables] = useState<Deliverables | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`${API_BASE}/approvals?approvalId=${id}`, { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : []))
      .then((results) => {
        const next = results?.[0] ?? null;
        setApproval(next);
        if (next?.linkedEntityType === "deliverable_pack") {
          fetch(`${API_BASE}/exports/study/${next.linkedEntityId}/deliverables`, { headers: HEADERS })
            .then((r) => (r.ok ? r.json() : null))
            .then(setDeliverables);
        }
      });
  }, [id]);

  const decide = async (nextStatus: "approved" | "rejected") => {
    if (!approval) return;
    setStatus("Submitting...");
    const res = await fetch(`${API_BASE}/approvals/${approval.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...HEADERS },
      body: JSON.stringify({ status: nextStatus, decisionNote }),
    });
    if (!res.ok) {
      setStatus("Failed to submit decision.");
      return;
    }
    setStatus("Decision submitted.");
    setLastDecision(nextStatus);
    fetch(`${API_BASE}/approvals?approvalId=${approval.id}`, { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : []))
      .then((results) => setApproval(results?.[0] ?? null));
  };

  if (!approval) {
    return <main className="p-8">Loading…</main>;
  }

  return (
    <main className="min-h-screen px-8 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Approval Detail</h1>
        <Link href="/client/approvals" className="text-brand-600 hover:underline">
          Back to approvals
        </Link>
      </div>
      <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-600">
          {approval.linkedEntityType} · {approval.linkedEntityId}
        </p>
        <p className="mt-2 text-sm text-gray-600">Status: {approval.status}</p>
        {approval.linkedEntityType === "deliverable_pack" && deliverables && (
          <div className="mt-4 rounded-xl border border-gray-100 p-4">
            <div className="text-xs uppercase text-gray-500">Deliverable pack</div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-gray-100 p-3">
                <div className="text-xs uppercase text-gray-500">Reports</div>
                {deliverables.reports.length === 0 ? (
                  <p className="mt-2 text-xs text-gray-500">No report exports yet.</p>
                ) : (
                  <ul className="mt-2 space-y-2 text-xs text-gray-700">
                    {deliverables.reports.map((report) => (
                      <li key={report.id} className="rounded-lg border border-gray-100 p-2">
                        {report.type ?? "report"} · {report.id}
                        <div className="mt-2 flex flex-wrap gap-3 text-xs text-brand-600">
                          <a
                            href={`${API_BASE}${report.downloads.markdown}`}
                            className="hover:underline"
                          >
                            Markdown
                          </a>
                          <a href={`${API_BASE}${report.downloads.pdf}`} className="hover:underline">
                            PDF
                          </a>
                          <a
                            href={`${API_BASE}${report.downloads.pptOutline}`}
                            className="hover:underline"
                          >
                            PPT outline
                          </a>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="rounded-lg border border-gray-100 p-3">
                <div className="text-xs uppercase text-gray-500">Stories</div>
                {deliverables.stories.length === 0 ? (
                  <p className="mt-2 text-xs text-gray-500">No activation assets yet.</p>
                ) : (
                  <ul className="mt-2 space-y-2 text-xs text-gray-700">
                    {deliverables.stories.map((story) => (
                      <li key={story.id} className="rounded-lg border border-gray-100 p-2">
                        {story.type} · {story.title}
                        <div className="mt-2 flex flex-wrap gap-3 text-xs text-brand-600">
                          <a href={`${API_BASE}${story.downloads.markdown}`} className="hover:underline">
                            Markdown
                          </a>
                          <a href={`${API_BASE}${story.downloads.pdf}`} className="hover:underline">
                            PDF
                          </a>
                          <a
                            href={`${API_BASE}${story.downloads.audioScript}`}
                            className="hover:underline"
                          >
                            Audio script
                          </a>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
        {lastDecision && (
          <p className="mt-2 text-xs text-gray-500">
            Your decision: {lastDecision === "approved" ? "Approved" : "Requested changes"}
          </p>
        )}
        {approval.status === "requested" && (
          <div className="mt-4 space-y-3">
            <label className="text-sm text-gray-600">
              Decision note
              <textarea
                value={decisionNote}
                onChange={(event) => setDecisionNote(event.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-200 p-2 text-sm"
                rows={3}
                placeholder="Optional: add context for your decision."
              />
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => decide("approved")}
                className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => decide("rejected")}
                className="rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white"
              >
                Request changes
              </button>
            </div>
            {status && <p className="text-xs text-gray-500">{status}</p>}
          </div>
        )}
        {approval.decisionNote && (
          <p className="mt-3 text-sm text-gray-700">Decision note: {approval.decisionNote}</p>
        )}
        {approval.decidedAt && (
          <p className="mt-2 text-xs text-gray-500">
            Decided {new Date(approval.decidedAt).toLocaleDateString()}
          </p>
        )}
      </section>
    </main>
  );
}
