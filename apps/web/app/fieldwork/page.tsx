"use client";

import { useEffect, useState } from "react";
import { useApi } from "../lib/use-api";

type Study = {
  id: string;
  name: string;
  status: string;
};

type LinkEntry = {
  studyId: string;
  token: string;
  url: string;
  createdAt: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function FieldworkPage() {
  const { apiFetch, user } = useApi();
  const [studies, setStudies] = useState<Study[]>([]);
  const [responseCounts, setResponseCounts] = useState<Record<string, number>>({});
  const [links, setLinks] = useState<Record<string, LinkEntry[]>>({});
  const [generating, setGenerating] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const workspaceId = user?.workspaceId ?? "";

  useEffect(() => {
    if (!workspaceId) return;
    apiFetch(`/studies?workspaceId=${workspaceId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(async (list: Study[]) => {
        setStudies(list);
        // Fetch session counts in parallel
        const counts = await Promise.all(
          list.map((s) =>
            apiFetch(`/sessions?studyId=${s.id}`)
              .then((r) => (r.ok ? r.json() : []))
              .then((sessions: unknown[]) => [s.id, sessions.length] as [string, number]),
          ),
        );
        setResponseCounts(Object.fromEntries(counts));
        setLoading(false);
      });
  }, [workspaceId]);

  async function generateLink(study: Study) {
    setGenerating((prev) => ({ ...prev, [study.id]: true }));
    const res = await apiFetch(`/embed/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studyId: study.id }),
    });
    if (res.ok) {
      const { token } = await res.json() as { token: string };
      const url = `${window.location.origin}/p/${token}`;
      const entry: LinkEntry = { studyId: study.id, token, url, createdAt: new Date().toISOString() };
      setLinks((prev) => ({ ...prev, [study.id]: [entry, ...(prev[study.id] ?? [])] }));
    }
    setGenerating((prev) => ({ ...prev, [study.id]: false }));
  }

  function copyLink(url: string, key: string) {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  return (
    <main className="min-h-screen px-8 py-10">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">Fieldwork</h1>
        <p className="mt-1 text-sm text-gray-500">
          Generate participant links to share for each study. Participants open the link and complete
          the interview by voice or text — no account required.
        </p>
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-gray-400">Loading studies…</p>
      ) : studies.length === 0 ? (
        <div className="mt-8 rounded-2xl bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-gray-500">No studies yet.</p>
          <a
            href="/studies"
            className="mt-3 inline-block rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Create a study →
          </a>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {studies.map((study) => (
            <div key={study.id} className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-950">{study.name}</h2>
                  <div className="mt-1 flex items-center gap-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        study.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {study.status}
                    </span>
                    <span className="text-xs text-gray-400">
                      {responseCounts[study.id] ?? 0} response
                      {responseCounts[study.id] !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => generateLink(study)}
                  disabled={generating[study.id]}
                  className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {generating[study.id] ? "Generating…" : "Generate link"}
                </button>
              </div>

              {/* Generated links */}
              {(links[study.id] ?? []).length > 0 && (
                <div className="mt-4 space-y-2">
                  {(links[study.id] ?? []).map((entry) => {
                    const key = `${study.id}-${entry.token}`;
                    return (
                      <div
                        key={key}
                        className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-2"
                      >
                        <span className="truncate font-mono text-xs text-gray-600">{entry.url}</span>
                        <button
                          type="button"
                          onClick={() => copyLink(entry.url, key)}
                          className="shrink-0 rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          {copied === key ? "Copied!" : "Copy link"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
