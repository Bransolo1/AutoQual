"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const HEADERS = { "x-workspace-id": "demo-workspace-id", "x-user-id": "demo-user", "x-role": "client" };

type ReportJson = {
  study: { id: string; name: string; status: string };
  segmentSummary?: Record<string, number>;
  themeQuantification?: Record<string, number>;
  transcriptSnippets?: string[];
  videoClips?: { id: string; mediaArtifactId: string; startMs: number; endMs: number }[];
};

export default function ClientReportsPage() {
  const searchParams = useSearchParams();
  const studyId = searchParams?.get("studyId") ?? "demo-study-id";
  const [report, setReport] = useState<ReportJson | null>(null);
  const [clipUrl, setClipUrl] = useState<string | null>(null);
  const [clipThumbnails, setClipThumbnails] = useState<Record<string, string>>({});
  const [approvals, setApprovals] = useState<
    { id: string; status: string; decidedByUserId?: string | null; decidedAt?: string | null }[]
  >([]);
  const [deliverableApprovals, setDeliverableApprovals] = useState<
    { id: string; status: string; decidedByUserId?: string | null; decidedAt?: string | null }[]
  >([]);
  const [exportsList, setExportsList] = useState<{ id: string; type: string; createdAt?: string }[]>([]);
  const [selectedExportId, setSelectedExportId] = useState<string>("");
  const [evidenceSearch, setEvidenceSearch] = useState("");
  const [stories, setStories] = useState<
    { id: string; type: string; title: string; summary?: string; content: string; mediaUrl?: string }[]
  >([]);
  const [deliverables, setDeliverables] = useState<
    | {
        reports: { id: string; type: string; createdAt?: string; downloads: Record<string, string> }[];
        stories: { id: string; title: string; type: string; createdAt?: string; downloads: Record<string, string> }[];
      }
    | null
  >(null);
  const [feedbackNote, setFeedbackNote] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState<string | null>(null);
  const [feedbackList, setFeedbackList] = useState<
    { id: string; sentiment?: string | null; rating?: number | null; notes?: string | null }[]
  >([]);
  const [activationMetrics, setActivationMetrics] = useState<
    {
      id: string;
      deliverableType: string;
      deliverableId?: string | null;
      views: number;
      shares: number;
      decisionsLogged: number;
      updatedAt: string;
    }[]
  >([]);
  const [kpiFilter, setKpiFilter] = useState("all");

  useEffect(() => {
    fetch(`${API_BASE}/exports/study/${studyId}/json`, { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : null))
      .then(setReport);
    fetch(`${API_BASE}/exports?studyId=${studyId}`, { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : []))
      .then((exportsList: { id: string }[]) => {
        setExportsList(exportsList ?? []);
        const exportId = exportsList?.[0]?.id ?? "";
        setSelectedExportId(exportId);
      });
    fetch(`${API_BASE}/stories?studyId=${studyId}`, { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : []))
      .then(setStories);
    fetch(`${API_BASE}/exports/study/${studyId}/deliverables`, { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : null))
      .then(setDeliverables);
    fetch(`${API_BASE}/feedback?projectId=demo-project-id`, { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : []))
      .then(setFeedbackList);
    fetch(`${API_BASE}/activation-metrics?projectId=demo-project-id`, { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : []))
      .then(setActivationMetrics);
  }, [studyId]);

  const submitFeedback = async (deliverableType: "deliverable_pack" | "report" | "story") => {
    setFeedbackStatus("Submitting...");
    const res = await fetch(`${API_BASE}/feedback`, {
      method: "POST",
      headers: { ...HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({
        workspaceId: "demo-workspace-id",
        projectId: "demo-project-id",
        studyId,
        deliverableType,
        deliverableId: deliverableType === "report" ? selectedExportId : undefined,
        stakeholderName: "Client stakeholder",
        stakeholderRole: "Client",
        sentiment: "neutral",
        notes: feedbackNote.trim(),
      }),
    });
    setFeedbackStatus(res.ok ? "Feedback submitted." : "Failed to submit feedback.");
    if (res.ok) {
      setFeedbackNote("");
      fetch(`${API_BASE}/feedback?projectId=demo-project-id`, { headers: HEADERS })
        .then((r) => (r.ok ? r.json() : []))
        .then(setFeedbackList);
    }
  };

  useEffect(() => {
    if (!selectedExportId) {
      setApprovals([]);
      return;
    }
    fetch(
      `${API_BASE}/approvals?linkedEntityType=report&linkedEntityId=${selectedExportId}`,
      { headers: HEADERS },
    )
      .then((r) => (r.ok ? r.json() : []))
      .then(setApprovals);
  }, [selectedExportId]);

  useEffect(() => {
    fetch(
      `${API_BASE}/approvals?linkedEntityType=deliverable_pack&linkedEntityId=${studyId}`,
      { headers: HEADERS },
    )
      .then((r) => (r.ok ? r.json() : []))
      .then(setDeliverableApprovals);
  }, [studyId]);

  if (!report) {
    return <main className="p-8">Loading…</main>;
  }

  return (
    <main className="min-h-screen px-8 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Client Report</h1>
        <Link href="/client" className="text-brand-600 hover:underline">
          Back to portal
        </Link>
      </div>

      <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">{report.study.name}</h2>
        <p className="mt-2 text-sm text-gray-600">Status: {report.study.status}</p>
      </section>

      {exportsList.length > 0 && (
        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Report versions</h2>
          <select
            className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            value={selectedExportId}
            onChange={(event) => setSelectedExportId(event.target.value)}
          >
            {exportsList.map((exportItem) => (
              <option key={exportItem.id} value={exportItem.id}>
                {exportItem.type ?? "report"} · {exportItem.id}
                {exportItem.createdAt ? ` · ${new Date(exportItem.createdAt).toLocaleDateString()}` : ""}
              </option>
            ))}
          </select>
        </section>
      )}

      {(approvals.length > 0 || deliverableApprovals.length > 0) && (
        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Approval history</h2>
          <ul className="mt-3 space-y-2 text-sm text-gray-700">
            {deliverableApprovals.map((approval) => (
              <li key={approval.id} className="rounded-lg border border-gray-100 p-3">
                Deliverable pack · {approval.status}
                {approval.decidedByUserId && <span> · Decided by {approval.decidedByUserId}</span>}
                {approval.decidedAt && (
                  <span> · {new Date(approval.decidedAt).toLocaleDateString()}</span>
                )}
              </li>
            ))}
            {approvals.map((approval) => (
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

      {deliverables && (
        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Deliverable pack</h2>
          <p className="mt-2 text-sm text-gray-600">
            Consolidated report and activation assets ready for distribution.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-gray-100 p-4">
              <div className="text-xs uppercase text-gray-500">Report exports</div>
              {deliverables.reports.length === 0 ? (
                <p className="mt-2 text-xs text-gray-500">No report exports yet.</p>
              ) : (
                <ul className="mt-3 space-y-2 text-sm text-gray-700">
                  {deliverables.reports.map((reportItem) => (
                    <li key={reportItem.id} className="rounded-lg border border-gray-100 p-3">
                      {reportItem.type ?? "report"} · {reportItem.id}
                      {reportItem.createdAt && (
                        <span> · {new Date(reportItem.createdAt).toLocaleDateString()}</span>
                      )}
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-brand-600">
                        <a
                          href={`${API_BASE}${reportItem.downloads.markdown}`}
                          className="hover:underline"
                        >
                          Markdown
                        </a>
                        <a href={`${API_BASE}${reportItem.downloads.pdf}`} className="hover:underline">
                          PDF
                        </a>
                        <a
                          href={`${API_BASE}${reportItem.downloads.pptOutline}`}
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
            <div className="rounded-xl border border-gray-100 p-4">
              <div className="text-xs uppercase text-gray-500">Activation stories</div>
              {deliverables.stories.length === 0 ? (
                <p className="mt-2 text-xs text-gray-500">No activation assets yet.</p>
              ) : (
                <ul className="mt-3 space-y-2 text-sm text-gray-700">
                  {deliverables.stories.map((story) => (
                    <li key={story.id} className="rounded-lg border border-gray-100 p-3">
                      {story.type} · {story.title}
                      {story.createdAt && <span> · {new Date(story.createdAt).toLocaleDateString()}</span>}
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
          <div className="mt-4 rounded-xl border border-gray-100 p-4">
            <div className="text-xs uppercase text-gray-500">Feedback on deliverables</div>
            <textarea
              value={feedbackNote}
              onChange={(event) => setFeedbackNote(event.target.value)}
              className="mt-3 w-full rounded-lg border border-gray-200 p-3 text-sm"
              rows={3}
              placeholder="Share stakeholder feedback tied to this deliverable pack."
            />
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={() => submitFeedback("deliverable_pack")}
                className="rounded-full border border-brand-500 px-3 py-1 text-brand-600"
              >
                Submit for deliverable pack
              </button>
              <button
                type="button"
                onClick={() => submitFeedback("report")}
                className="rounded-full border border-gray-300 px-3 py-1 text-gray-600"
              >
                Submit for report
              </button>
              <button
                type="button"
                onClick={() => submitFeedback("story")}
                className="rounded-full border border-gray-300 px-3 py-1 text-gray-600"
              >
                Submit for story
              </button>
            </div>
            {feedbackStatus && <p className="mt-2 text-xs text-gray-500">{feedbackStatus}</p>}
            {feedbackList.length > 0 && (
              <div className="mt-3 text-xs text-gray-600">
                <div className="text-[11px] uppercase text-gray-500">Recent feedback</div>
                {feedbackList.slice(0, 5).map((item) => (
                  <div key={item.id} className="mt-1">
                    {item.sentiment ?? "unspecified"} · Rating {item.rating ?? "n/a"} ·{" "}
                    {item.notes ? item.notes.slice(0, 80) : "No notes"}
                  </div>
                ))}
              </div>
            )}
          </div>
          {activationMetrics.length > 0 && (
            <div className="mt-4 rounded-xl border border-gray-100 p-4">
              <div className="text-xs uppercase text-gray-500">Activation KPIs by deliverable</div>
              <select
                value={kpiFilter}
                onChange={(event) => setKpiFilter(event.target.value)}
                className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs"
              >
                <option value="all">All deliverables</option>
                <option value="deliverable_pack">Deliverable pack</option>
                <option value="report">Report</option>
                <option value="story">Story</option>
              </select>
              <div className="mt-3 space-y-2 text-xs text-gray-600">
                {activationMetrics
                  .filter((metric) => kpiFilter === "all" || metric.deliverableType === kpiFilter)
                  .map((metric) => (
                  <div key={metric.id} className="rounded-lg border border-gray-100 p-3">
                    {metric.deliverableType} · {metric.deliverableId ?? "n/a"} · {metric.views} views ·{" "}
                    {metric.shares} shares · {metric.decisionsLogged} decisions
                  </div>
                ))}
              </div>
              <div className="mt-4 text-xs text-gray-600">
                <div className="text-[11px] uppercase text-gray-500">Weekly trend by type</div>
                {(() => {
                  const byTypeWeek = activationMetrics.reduce<
                    Record<string, { deliverableType: string; views: number; shares: number; decisions: number }>
                  >((acc, metric) => {
                    const date = new Date(metric.updatedAt);
                    const day = date.getUTCDay() || 7;
                    const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
                    start.setUTCDate(start.getUTCDate() - day + 1);
                    const week = start.toISOString().slice(0, 10);
                    const key = `${metric.deliverableType}:${week}`;
                    acc[key] = acc[key] ?? {
                      deliverableType: metric.deliverableType,
                      views: 0,
                      shares: 0,
                      decisions: 0,
                    };
                    acc[key].views += metric.views ?? 0;
                    acc[key].shares += metric.shares ?? 0;
                    acc[key].decisions += metric.decisionsLogged ?? 0;
                    return acc;
                  }, {});
                  return Object.entries(byTypeWeek)
                    .map(([key, values]) => ({ week: key.split(":").slice(1).join(":"), ...values }))
                    .sort((a, b) => (a.week < b.week ? -1 : 1))
                    .filter((row) => kpiFilter === "all" || row.deliverableType === kpiFilter)
                    .map((row) => (
                      <div key={`${row.week}-${row.deliverableType}`} className="mt-1">
                        Week {row.week} · {row.deliverableType}: {row.views} views · {row.shares} shares ·{" "}
                        {row.decisions} decisions
                      </div>
                    ));
                })()}
              </div>
              <div className="mt-4 text-xs text-gray-600">
                <div className="text-[11px] uppercase text-gray-500">Alerts</div>
                {activationMetrics
                  .filter((metric) => metric.views < 5)
                  .slice(0, 5)
                  .map((metric) => (
                    <div key={`alert-${metric.id}`} className="mt-1 text-amber-600">
                      Low activation · {metric.deliverableType} · {metric.deliverableId ?? "n/a"} ·{" "}
                      {metric.views} views
                    </div>
                  ))}
                {activationMetrics.every((metric) => metric.views >= 5) && (
                  <div className="mt-1 text-xs text-gray-500">No low-activation alerts.</div>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Segment summary</h2>
          <div className="mt-3 grid gap-2">
            {Object.entries(report.segmentSummary ?? {}).map(([segment, count]) => (
              <div key={segment} className="flex items-center justify-between text-sm text-gray-700">
                <span>{segment}</span>
                <span className="font-semibold">{count}</span>
              </div>
            ))}
            {Object.keys(report.segmentSummary ?? {}).length === 0 && (
              <p className="text-sm text-gray-500">No segment data.</p>
            )}
          </div>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Theme quantification</h2>
          <div className="mt-3 grid gap-2">
            {Object.entries(report.themeQuantification ?? {}).map(([label, count]) => (
              <div key={label} className="flex items-center justify-between text-sm text-gray-700">
                <span>{label}</span>
                <span className="font-semibold">{count}</span>
              </div>
            ))}
            {Object.keys(report.themeQuantification ?? {}).length === 0 && (
              <p className="text-sm text-gray-500">No themes yet.</p>
            )}
          </div>
        </div>
      </section>

      {report.transcriptSnippets?.length ? (
        <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Quote traceability</h2>
          <ul className="mt-3 space-y-2 text-sm text-gray-700">
            {report.transcriptSnippets.map((snippet, index) => (
              <li key={`${snippet}-${index}`} className="rounded-lg border border-gray-100 p-3">
                “{snippet}”
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {stories.length > 0 && (
        <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Activation stories</h2>
          <p className="mt-2 text-sm text-gray-600">
            Ready-to-share narratives for articles, video reels, and podcasts.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {stories.map((story) => (
              <div key={story.id} className="rounded-xl border border-gray-100 p-4">
                <div className="text-xs uppercase text-gray-500">{story.type}</div>
                <div className="mt-1 text-sm font-semibold text-gray-900">{story.title}</div>
                {story.summary && <p className="mt-2 text-xs text-gray-600">{story.summary}</p>}
                <pre className="mt-3 whitespace-pre-wrap text-xs text-gray-700">{story.content}</pre>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-brand-600">
                  <a
                    href={`${API_BASE}/exports/story/${story.id}/markdown`}
                    className="hover:underline"
                  >
                    Markdown
                  </a>
                  <a href={`${API_BASE}/exports/story/${story.id}/pdf`} className="hover:underline">
                    PDF
                  </a>
                  <a
                    href={`${API_BASE}/exports/story/${story.id}/audio-script`}
                    className="hover:underline"
                  >
                    Audio script
                  </a>
                </div>
                {story.mediaUrl && (
                  <a
                    href={story.mediaUrl}
                    className="mt-3 inline-block text-xs text-brand-600 hover:underline"
                  >
                    View media →
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {report.videoClips?.length ? (
        <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Video proof</h2>
            <input
              value={evidenceSearch}
              onChange={(event) => setEvidenceSearch(event.target.value)}
              placeholder="Filter by clip id"
              className="rounded-lg border border-gray-200 px-3 py-2 text-xs"
            />
          </div>
          <ul className="mt-3 space-y-2 text-sm text-gray-700">
            {report.videoClips
              .filter((clip) =>
                clip.id.toLowerCase().includes(evidenceSearch.trim().toLowerCase()),
              )
              .map((clip) => (
              <li key={clip.id} className="rounded-lg border border-gray-100 p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span>Clip {clip.id} · {clip.startMs}–{clip.endMs}ms</span>
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
          <a
            href={`${API_BASE}/exports/study/${studyId}/pdf`}
            className="mt-3 inline-block text-xs text-brand-600 hover:underline"
          >
            Download PDF →
          </a>
          <a
            href={`${API_BASE}/exports/study/${studyId}/evidence-bundle.csv`}
            className="mt-3 inline-block text-xs text-brand-600 hover:underline"
          >
            Download evidence bundle →
          </a>
        </section>
      ) : null}

      {clipUrl && (
        <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Clip preview</h2>
          <video controls className="mt-3 w-full rounded-lg bg-black">
            <source src={clipUrl} />
          </video>
        </section>
      )}
    </main>
  );
}
