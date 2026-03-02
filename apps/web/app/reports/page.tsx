"use client";

import { useState } from "react";
import { API_BASE, HEADERS } from "@/lib/api";

type ReportJson = {
  study: { id: string; name: string; status: string };
  segmentSummary?: Record<string, number>;
  themeQuantification?: Record<string, number>;
  transcriptSnippets?: string[];
  videoClips?: { id: string; mediaArtifactId: string; startMs: number; endMs: number }[];
  insights: { id: string; statement: string; confidenceScore: number; businessImplication: string }[];
};

export default function ReportsPage() {
  const [studyId, setStudyId] = useState("demo-study-id");
  const [markdown, setMarkdown] = useState("");
  const [json, setJson] = useState<ReportJson | null>(null);
  const [pptOutline, setPptOutline] = useState<string[]>([]);
  const [audioRecap, setAudioRecap] = useState<string>("");
  const [status, setStatus] = useState<string | null>(null);
  const [clipUrl, setClipUrl] = useState<string | null>(null);
  const [evidenceBundle, setEvidenceBundle] = useState<string[]>([]);
  const [reportApprovals, setReportApprovals] = useState<
    { id: string; status: string; decidedByUserId?: string | null; decidedAt?: string | null }[]
  >([]);
  const [clipThumbnails, setClipThumbnails] = useState<Record<string, string>>({});

  const loadReport = async () => {
    setStatus("Loading report...");
    const [mdRes, jsonRes, pptRes, recapRes] = await Promise.all([
      fetch(`${API_BASE}/exports/study/${studyId}/markdown`, { headers: HEADERS }),
      fetch(`${API_BASE}/exports/study/${studyId}/json`, { headers: HEADERS }),
      fetch(`${API_BASE}/exports/study/${studyId}/ppt-outline`, { headers: HEADERS }),
      fetch(`${API_BASE}/exports/study/${studyId}/audio-recap`, { headers: HEADERS }),
    ]);

    if (!mdRes.ok || !jsonRes.ok || !pptRes.ok || !recapRes.ok) {
      setStatus("Failed to load report.");
      return;
    }
    setMarkdown(await mdRes.text());
    setJson(await jsonRes.json());
    const pptPayload = await pptRes.json();
    setPptOutline((pptPayload?.slides ?? []).map((slide: { title: string }) => slide.title));
    const recapPayload = await recapRes.json();
    setAudioRecap(recapPayload?.script ?? "");
    const bundleRes = await fetch(`${API_BASE}/exports/study/${studyId}/evidence-bundle`, { headers: HEADERS });
    const bundlePayload = bundleRes.ok ? await bundleRes.json() : null;
    setEvidenceBundle(
      (bundlePayload?.clips ?? []).map((clip: { id: string; storageKey: string }) =>
        `${clip.id} · ${clip.storageKey}`,
      ),
    );
    const exportsRes = await fetch(`${API_BASE}/exports?studyId=${studyId}`, { headers: HEADERS });
    const exportsList = exportsRes.ok ? await exportsRes.json() : [];
    const latestExport = exportsList?.[0];
    if (latestExport?.id) {
      const approvalsRes = await fetch(
        `${API_BASE}/approvals?linkedEntityType=report&linkedEntityId=${latestExport.id}`,
        { headers: HEADERS },
      );
      setReportApprovals(approvalsRes.ok ? await approvalsRes.json() : []);
    } else {
      setReportApprovals([]);
    }
    setStatus("Report loaded.");
  };

  return (
    <main className="min-h-screen px-8 py-10">
      <h1 className="text-2xl font-semibold">Report Preview</h1>
      <p className="mt-2 text-sm text-gray-600">
        Load the latest export formats for a study (Markdown, JSON, PPT outline, audio recap).
      </p>
      <div className="mt-4 flex flex-wrap gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <input
          value={studyId}
          onChange={(event) => setStudyId(event.target.value)}
          placeholder="Study ID"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={loadReport}
          className="rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white"
        >
          Load report
        </button>
        {status && <span className="self-center text-xs text-gray-500">{status}</span>}
      </div>

      {json && (
        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Segment summary</h2>
            <div className="mt-3 grid gap-2">
              {Object.entries(json.segmentSummary ?? {}).map(([segment, count]) => (
                <div key={segment} className="flex items-center justify-between text-sm text-gray-700">
                  <span>{segment}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
              {Object.keys(json.segmentSummary ?? {}).length === 0 && (
                <p className="text-sm text-gray-500">No segment data.</p>
              )}
            </div>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Theme quantification</h2>
            <div className="mt-3 grid gap-2">
              {Object.entries(json.themeQuantification ?? {}).map(([label, count]) => (
                <div key={label} className="flex items-center justify-between text-sm text-gray-700">
                  <span>{label}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
              {Object.keys(json.themeQuantification ?? {}).length === 0 && (
                <p className="text-sm text-gray-500">No themes yet.</p>
              )}
            </div>
          </div>
        </section>
      )}

      {json?.transcriptSnippets && json.transcriptSnippets.length > 0 && (
        <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Quote traceability</h2>
          <ul className="mt-3 space-y-2 text-sm text-gray-700">
            {json.transcriptSnippets.map((snippet, index) => (
              <li key={`${snippet}-${index}`} className="rounded-lg border border-gray-100 p-3">
                “{snippet}”
              </li>
            ))}
          </ul>
        </section>
      )}

      {json?.videoClips && json.videoClips.length > 0 && (
        <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Video proof</h2>
          <ul className="mt-3 space-y-2 text-sm text-gray-700">
            {json.videoClips.map((clip) => (
              <li key={clip.id} className="rounded-lg border border-gray-100 p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span>
                    Clip {clip.id} · {clip.startMs}–{clip.endMs}ms · Artifact {clip.mediaArtifactId}
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!clipThumbnails[clip.id]) {
                        const thumbRes = await fetch(`${API_BASE}/media/clips/${clip.id}/thumbnail`, {
                          headers: HEADERS,
                        });
                        const thumb = thumbRes.ok ? await thumbRes.json() : null;
                        if (thumb?.thumbnailUrl) {
                          setClipThumbnails((prev) => ({ ...prev, [clip.id]: thumb.thumbnailUrl }));
                        }
                      }
                      const res = await fetch(
                        `${API_BASE}/media/artifacts/${clip.mediaArtifactId}/signed-url`,
                        { headers: HEADERS },
                      );
                      const data = res.ok ? await res.json() : null;
                      setClipUrl(data?.url ?? null);
                    }}
                    className="text-xs text-brand-600 hover:underline"
                  >
                    Preview
                  </button>
                </div>
                {clipThumbnails[clip.id] && (
                  <img
                    src={clipThumbnails[clip.id]}
                    alt={`Clip ${clip.id} thumbnail`}
                    className="mt-3 h-40 w-full rounded-lg object-cover"
                  />
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {clipUrl && (
        <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Clip preview</h2>
          <video controls className="mt-3 w-full rounded-lg bg-black">
            <source src={clipUrl} />
          </video>
        </section>
      )}

      {markdown && (
        <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Markdown preview</h2>
          <pre className="mt-3 whitespace-pre-wrap text-sm text-gray-700">{markdown}</pre>
        </section>
      )}

      {pptOutline.length > 0 && (
        <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">PPT outline</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-700">
            {pptOutline.map((title) => (
              <li key={title}>{title}</li>
            ))}
          </ul>
        </section>
      )}

      {audioRecap && (
        <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Audio recap</h2>
          <p className="mt-3 text-sm text-gray-700">{audioRecap}</p>
        </section>
      )}

      {reportApprovals.length > 0 && (
        <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Report approvals</h2>
          <ul className="mt-3 space-y-2 text-sm text-gray-700">
            {reportApprovals.map((approval) => (
              <li key={approval.id} className="rounded-lg border border-gray-100 p-3">
                Status: {approval.status}
                {approval.decidedByUserId && <span> · Decided by {approval.decidedByUserId}</span>}
                {approval.decidedAt && (
                  <span> · {new Date(approval.decidedAt).toLocaleDateString()}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {evidenceBundle.length > 0 && (
        <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Evidence bundle</h2>
          <a
            href={`${API_BASE}/exports/study/${studyId}/evidence-bundle.csv`}
            className="mt-2 inline-block text-xs text-brand-600 hover:underline"
          >
            Download CSV →
          </a>
          <ul className="mt-3 space-y-2 text-sm text-gray-700">
            {evidenceBundle.map((entry) => (
              <li key={entry} className="rounded-lg border border-gray-100 p-3">
                {entry}
              </li>
            ))}
          </ul>
        </section>
      )}

      {markdown && (
        <a
          href={`${API_BASE}/exports/study/${studyId}/pdf`}
          className="mt-6 inline-block text-xs text-brand-600 hover:underline"
        >
          Download PDF →
        </a>
      )}
    </main>
  );
}
