"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useApi } from "../../lib/use-api";

type Participant = {
  id: string;
  email: string;
  segment?: string;
  source?: string;
  verificationStatus?: string;
  fraudScore?: number | null;
  createdAt: string;
  study?: { id: string; name: string };
};

export default function RecruitmentOpsPage() {
  const { apiFetch, user } = useApi();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [statusFilter, setStatusFilter] = useState("flagged");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);

  const loadParticipants = async () => {
    const res = await fetch(
      `/participants?workspaceId=${user?.workspaceId ?? ""}&status=${statusFilter}`,
      { },
    );
    if (!res.ok) return;
    const payload = await res.json();
    setParticipants(payload ?? []);
    setSelected({});
  };

  useEffect(() => {
    loadParticipants();
  }, [statusFilter]);

  const selectedIds = useMemo(
    () => participants.filter((p) => selected[p.id]).map((p) => p.id),
    [participants, selected],
  );

  const updateBulk = async (status: "verified" | "flagged" | "rejected") => {
    if (!selectedIds.length) return;
    setBusy(true);
    const res = await apiFetch(`/participants/verify-bulk`, {
      method: "POST",
      headers: { ...HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selectedIds, status, fraudScore: status === "verified" ? 0 : 70 }),
    });
    setBusy(false);
    if (res.ok) {
      await loadParticipants();
    }
  };

  return (
    <main className="min-h-screen px-8 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Recruitment Verification</h1>
          <p className="mt-2 text-sm text-gray-600">
            Review flagged participants and enforce verification decisions.
          </p>
        </div>
        <Link href="/ops" className="text-brand-600 hover:underline">Back to Ops</Link>
      </div>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-sm">
            <label className="text-gray-500">Status</label>
            <select
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="flagged">Flagged</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              type="button"
              disabled={busy || selectedIds.length === 0}
              onClick={() => updateBulk("verified")}
              className="rounded-full border border-emerald-500 px-3 py-1 text-emerald-600"
            >
              Verify selected
            </button>
            <button
              type="button"
              disabled={busy || selectedIds.length === 0}
              onClick={() => updateBulk("flagged")}
              className="rounded-full border border-amber-500 px-3 py-1 text-amber-600"
            >
              Keep flagged
            </button>
            <button
              type="button"
              disabled={busy || selectedIds.length === 0}
              onClick={() => updateBulk("rejected")}
              className="rounded-full border border-rose-500 px-3 py-1 text-rose-600"
            >
              Reject selected
            </button>
          </div>
        </div>

        {participants.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">No participants match this filter.</p>
        ) : (
          <div className="mt-4 space-y-2 text-sm text-gray-700">
            {participants.map((participant) => (
              <label
                key={participant.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 p-3"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={!!selected[participant.id]}
                    onChange={(event) =>
                      setSelected((prev) => ({ ...prev, [participant.id]: event.target.checked }))
                    }
                  />
                  <div>
                    <div className="text-sm font-medium">{participant.email}</div>
                    <div className="text-xs text-gray-500">
                      Study {participant.study?.name ?? participant.study?.id ?? "n/a"} · Segment{" "}
                      {participant.segment ?? "unassigned"} · Source {participant.source ?? "panel"}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Status {participant.verificationStatus ?? "pending"}
                  {participant.fraudScore !== null && participant.fraudScore !== undefined
                    ? ` · Fraud score ${participant.fraudScore}`
                    : ""}
                </div>
              </label>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
