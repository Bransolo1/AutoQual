"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const HEADERS = { "x-workspace-id": "demo-workspace-id", "x-user-id": "demo-user", "x-role": "client" };

type ClientView = {
  name: string;
  clientOrgName: string;
  studyIds?: string[];
  activationViewThreshold?: number;
  feedbackScoreThreshold?: number;
  localizationReadiness?: { studyId: string; language?: string; readinessPercent: number; missing: string[] }[];
  recruitmentReadiness?: { studyId: string; readinessPercent: number; missing: string[] }[];
  activationReadiness?: { studyId: string; readinessPercent: number; missing: string[] }[];
  rolloutReadiness?: { studyId: string; markets: string[]; status: string }[];
  distributionTracking?: { studyId: string; channels: string[]; measurement: string }[];
  deliveryHealth?: { studyId: string; score: number; status: string; notes: string }[];
  activationMetrics?: {
    id: string;
    studyId?: string | null;
    deliverableType: string;
    deliverableId?: string | null;
    views: number;
    shares: number;
    decisionsLogged: number;
    updatedAt: string;
  }[];
  milestones: { name: string; status: string; dueDate: string }[];
  approvedDeliverables: { type: string; id: string }[];
  insightHeadlines: { id: string; statement: string }[];
  evidenceClips: {
    id: string;
    mediaArtifactId: string;
    startMs: number;
    endMs: number;
    transcriptSnippet?: string;
  }[];
  transcriptSnippets?: string[];
};

type AnalysisDelivery = {
  project: { id: string; name: string; clientOrgName?: string; status?: string; targetDeliveryDate?: string };
  studies: { id: string; name: string; status: string }[];
  insights: {
    id: string;
    studyId: string;
    statement: string;
    status: string;
    confidenceScore: number;
    businessImplication: string;
    tags: string[];
    updatedAt: string;
  }[];
  themes: { id: string; studyId: string; label: string; createdAt: string }[];
  exports: { id: string; studyId: string; type: string; storageKey: string; createdAt: string }[];
  stories: { id: string; studyId: string; type: string; title: string; summary?: string; createdAt: string }[];
  approvals: { id: string; linkedEntityType: string; linkedEntityId: string; status: string; decidedAt?: string | null }[];
  evidenceClips: { id: string; mediaArtifactId: string; startMs: number; endMs: number; createdAt: string }[];
  transcriptSnippets: string[];
  risks: {
    overdueMilestones: { id: string; name: string; status: string; dueDate: string }[];
    blockedTasks: { id: string; title: string; status: string; dueDate: string | null; blockedReason?: string | null }[];
    overdueTasks: { id: string; title: string; status: string; dueDate: string | null; blockedReason?: string | null }[];
    pendingApprovals: { id: string; linkedEntityType: string; linkedEntityId: string; status: string }[];
  };
  shareChecklist: { items: Record<string, boolean>; updatedAt: string | null };
  timeline: { type: string; id: string; studyId: string; label: string; createdAt: string }[];
};

export default function ClientPortalPage() {
  const searchParams = useSearchParams();
  const projectId = searchParams?.get("projectId");
  const formatChecklistKey = (key: string) =>
    key.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
  const [data, setData] = useState<ClientView | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [report, setReport] = useState<{
    segmentSummary?: Record<string, number>;
    themeQuantification?: Record<string, number>;
    insights?: { id: string; statement: string }[];
    transcriptSnippets?: string[];
  } | null>(null);
  const [reportMarkdown, setReportMarkdown] = useState<string | null>(null);
  const [clipThumbnails, setClipThumbnails] = useState<Record<string, string>>({});
  const [clientSearch, setClientSearch] = useState("");
  const [evidenceBundle, setEvidenceBundle] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<{ id?: string; statement?: string }[]>([]);
  const [searchStatus, setSearchStatus] = useState<string | null>(null);
  const [clientNotifications, setClientNotifications] = useState<
    { id: string; type: string; createdAt: string; payload?: Record<string, unknown> }[]
  >([]);
  const [notificationFilter, setNotificationFilter] = useState("");
  const [deliverableFilter, setDeliverableFilter] = useState("all");
  const [alertSeverityFilter, setAlertSeverityFilter] = useState("all");
  const [pendingApprovals, setPendingApprovals] = useState<
    { id: string; linkedEntityType: string; linkedEntityId: string; status: string }[]
  >([]);
  const [exportHistory, setExportHistory] = useState<{ id: string; type: string; createdAt?: string }[]>([]);
  const [feedbackNote, setFeedbackNote] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState<string | null>(null);
  const [feedbackSummary, setFeedbackSummary] = useState<
    Record<string, { total: number; avgRating: number | null }>
  >({});
  const [feedbackByStudy, setFeedbackByStudy] = useState<
    Record<string, { total: number; avgRating: number | null }>
  >({});
  const [analysisDelivery, setAnalysisDelivery] = useState<AnalysisDelivery | null>(null);
  const [deliveryFilter, setDeliveryFilter] = useState("all");
  const [deliverySort, setDeliverySort] = useState("newest");
  const [timelineVisibleCount, setTimelineVisibleCount] = useState(8);
  const [pendingVisibleCount, setPendingVisibleCount] = useState(6);
  const [shareChecklist, setShareChecklist] = useState<Record<string, boolean>>({});
  const [shareChecklistSaving, setShareChecklistSaving] = useState(false);
  const [shareChecklistError, setShareChecklistError] = useState<string | null>(null);
  const lastDeliveryDate = analysisDelivery?.timeline?.[0]?.createdAt
    ? new Date(analysisDelivery.timeline[0].createdAt)
    : null;
  const shareChecklistUpdatedAt = analysisDelivery?.shareChecklist?.updatedAt
    ? new Date(analysisDelivery.shareChecklist.updatedAt)
    : null;
  const targetDeliveryDate = analysisDelivery?.project?.targetDeliveryDate
    ? new Date(analysisDelivery.project.targetDeliveryDate)
    : null;
  const deliveryHealth = (() => {
    if (!targetDeliveryDate) return null;
    const now = new Date();
    if (lastDeliveryDate) {
      return lastDeliveryDate > targetDeliveryDate
        ? { label: "Late delivery", tone: "rose" }
        : { label: "On track", tone: "emerald" };
    }
    if (now > targetDeliveryDate) {
      return { label: "Overdue", tone: "rose" };
    }
    return { label: "Pending", tone: "amber" };
  })();
  const lowActivationThreshold = data?.activationViewThreshold ?? 10;
  const lowFeedbackThreshold = data?.feedbackScoreThreshold ?? 3;
  const [activationFilter, setActivationFilter] = useState("all");
  const activationTotals = data?.activationMetrics?.reduce(
    (acc, metric) => {
      acc.totalViews += metric.views ?? 0;
      acc.totalShares += metric.shares ?? 0;
      acc.totalDecisions += metric.decisionsLogged ?? 0;
      const key = metric.deliverableType ?? "unknown";
      acc.byType[key] = acc.byType[key] ?? { views: 0, shares: 0, decisions: 0 };
      acc.byType[key].views += metric.views ?? 0;
      acc.byType[key].shares += metric.shares ?? 0;
      acc.byType[key].decisions += metric.decisionsLogged ?? 0;
      return acc;
    },
    { totalViews: 0, totalShares: 0, totalDecisions: 0, byType: {} as Record<string, { views: number; shares: number; decisions: number }> },
  );
  const approvedDeliverableStudyIds = new Set(
    (analysisDelivery?.approvals ?? [])
      .filter((approval) => approval.linkedEntityType === "deliverable_pack" && approval.status === "approved")
      .map((approval) => approval.linkedEntityId),
  );
  const pendingApprovalCounts = (analysisDelivery?.approvals ?? []).reduce(
    (acc, approval) => {
      if (approval.status === "requested") {
        acc.total += 1;
        acc.byType[approval.linkedEntityType] = (acc.byType[approval.linkedEntityType] ?? 0) + 1;
      }
      return acc;
    },
    { total: 0, byType: {} as Record<string, number> },
  );
  const getApprovalForEntry = (entry: AnalysisDelivery["timeline"][number]) => {
    const approvals = analysisDelivery?.approvals ?? [];
    if (entry.type === "report_export") {
      return approvals.find(
        (approval) => approval.linkedEntityType === "report" && approval.linkedEntityId === entry.id,
      );
    }
    if (entry.type === "story") {
      return approvals.find(
        (approval) =>
          approval.linkedEntityType === "deliverable_pack" && approval.linkedEntityId === entry.studyId,
      );
    }
    if (entry.type === "insight") {
      return approvals.find(
        (approval) => approval.linkedEntityType === "insight_set" && approval.linkedEntityId === entry.studyId,
      );
    }
    return undefined;
  };
  const [stories, setStories] = useState<
    { id: string; type: string; title: string; summary?: string; content: string; mediaUrl?: string; createdAt: string }[]
  >([]);

  useEffect(() => {
    if (!projectId) return;
    fetch(`${API_BASE}/projects/${projectId}/client-view`, { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : null))
      .then(setData);
    fetch(`${API_BASE}/notifications?userId=demo-user&limit=5`, { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : []))
      .then(setClientNotifications);
    fetch(`${API_BASE}/approvals?status=requested`, { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : []))
      .then(setPendingApprovals);
    fetch(`${API_BASE}/feedback?projectId=${projectId}`, { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : []))
      .then((items: { deliverableType?: string; rating?: number | null; studyId?: string | null }[]) => {
        const summary = items.reduce<Record<string, { total: number; avgRating: number | null }>>(
          (acc, item) => {
            const key = item.deliverableType ?? "unknown";
            acc[key] = acc[key] ?? { total: 0, avgRating: null };
            acc[key].total += 1;
            if (typeof item.rating === "number") {
              const prevTotal = acc[key].avgRating ? acc[key].avgRating * (acc[key].total - 1) : 0;
              acc[key].avgRating = Math.round(((prevTotal + item.rating) / acc[key].total) * 10) / 10;
            }
            return acc;
          },
          {},
        );
        const byStudy = items.reduce<Record<string, { total: number; avgRating: number | null }>>(
          (acc, item) => {
            const key = item.studyId ?? "unassigned";
            acc[key] = acc[key] ?? { total: 0, avgRating: null };
            acc[key].total += 1;
            if (typeof item.rating === "number") {
              const prevTotal = acc[key].avgRating ? acc[key].avgRating * (acc[key].total - 1) : 0;
              acc[key].avgRating = Math.round(((prevTotal + item.rating) / acc[key].total) * 10) / 10;
            }
            return acc;
          },
          {},
        );
        setFeedbackSummary(summary);
        setFeedbackByStudy(byStudy);
      });
  }, [projectId]);

  useEffect(() => {
    if (!analysisDelivery?.shareChecklist?.items) return;
    setShareChecklist(analysisDelivery.shareChecklist.items);
  }, [analysisDelivery]);

  useEffect(() => {
    if (!projectId) return;
    fetch(`${API_BASE}/projects/${projectId}/analysis-delivery`, { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : null))
      .then(setAnalysisDelivery);
  }, [projectId]);


  useEffect(() => {
    if (!data?.studyIds?.[0]) return;
    fetch(`${API_BASE}/exports?studyId=${data.studyIds[0]}`, { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : []))
      .then(setExportHistory);
  }, [data]);

  useEffect(() => {
    if (!data?.studyIds?.[0]) return;
    fetch(`${API_BASE}/stories?studyId=${data.studyIds[0]}`, { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : []))
      .then(setStories);
  }, [data]);

  useEffect(() => {
    const reportStudyId = data?.studyIds?.[0];
    if (!reportStudyId) return;
    fetch(`${API_BASE}/exports/study/${reportStudyId}/json`, { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : null))
      .then(setReport);
    fetch(`${API_BASE}/exports/study/${reportStudyId}/markdown`, { headers: HEADERS })
      .then((r) => (r.ok ? r.text() : ""))
      .then((text) => setReportMarkdown(text || null));
    fetch(`${API_BASE}/exports/study/${reportStudyId}/evidence-bundle`, { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : null))
      .then((bundle) => {
        setEvidenceBundle(
          (bundle?.clips ?? []).map((clip: { id: string; storageKey: string }) =>
            `${clip.id} · ${clip.storageKey}`,
          ),
        );
      });
  }, [data]);

  if (!projectId) {
    return (
      <main className="min-h-screen px-8 py-10">
        <h1 className="text-2xl font-semibold">Client Portal</h1>
        <p className="mt-2 text-sm text-gray-600">Add ?projectId=... to view a project.</p>
        <Link href="/projects" className="mt-4 inline-block text-brand-600 hover:underline">View projects</Link>
      </main>
    );
  }

  if (!data) return <main className="p-8">Loading…</main>;

  const submitFeedback = async (deliverableType: "deliverable_pack" | "report" | "story") => {
    if (!projectId) return;
    setFeedbackStatus("Submitting...");
    const res = await fetch(`${API_BASE}/feedback`, {
      method: "POST",
      headers: { ...HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({
        workspaceId: "demo-workspace-id",
        projectId,
        studyId: data.studyIds?.[0],
        deliverableType,
        stakeholderName: "Client stakeholder",
        stakeholderRole: "Client",
        sentiment: "neutral",
        notes: feedbackNote.trim(),
      }),
    });
    setFeedbackStatus(res.ok ? "Feedback submitted." : "Failed to submit feedback.");
    if (res.ok) {
      setFeedbackNote("");
    }
  };

  const saveShareChecklist = async (next: Record<string, boolean>) => {
    setShareChecklist(next);
    if (!projectId) return;
    setShareChecklistSaving(true);
    setShareChecklistError(null);
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/share-checklist`, {
        method: "PATCH",
        headers: { ...HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: "demo-workspace-id",
          actorUserId: "demo-user",
          items: next,
        }),
      });
      if (!res.ok) {
        setShareChecklistError("Save failed.");
      }
    } catch {
      setShareChecklistError("Save failed.");
    } finally {
      setShareChecklistSaving(false);
    }
  };

  const activationByStudy = data?.activationMetrics?.reduce<Record<string, { views: number; shares: number }>>(
    (acc, metric) => {
      const key = metric.studyId ?? "unassigned";
      acc[key] = acc[key] ?? { views: 0, shares: 0 };
      acc[key].views += metric.views ?? 0;
      acc[key].shares += metric.shares ?? 0;
      return acc;
    },
    {},
  );

  return (
    <main className="min-h-screen px-8 py-10">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Client Portal</h1>
        <p className="mt-2 text-sm text-gray-600">
          {data.name} · {data.clientOrgName}
        </p>
      </div>

      <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Project Timeline</h2>
        <div className="mt-3 text-sm text-gray-600">
          {Math.round(
            (data.milestones.filter((m) => m.status === "done").length / Math.max(data.milestones.length, 1)) *
              100,
          )}
          % complete
        </div>
        <div className="mt-2 h-2 w-full rounded-full bg-gray-100">
          <div
            className="h-2 rounded-full bg-brand-500"
            style={{
              width: `${Math.round(
                (data.milestones.filter((m) => m.status === "done").length / Math.max(data.milestones.length, 1)) *
                  100,
              )}%`,
            }}
          />
        </div>
        <p className="mt-3 text-xs text-gray-500">
          Milestones progress in order; delays upstream can shift later dates.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {data.milestones.map((m) => (
            <div key={m.name} className="rounded-xl border border-gray-100 p-4">
              <p className="text-sm font-medium">{m.name}</p>
              <p className="mt-2 text-xs text-gray-500">{m.status}</p>
              <p className="mt-1 text-xs text-gray-400">{new Date(m.dueDate).toLocaleDateString()}</p>
              <p className="mt-2 text-[11px] text-gray-500">
                {m.name === "Fieldwork"
                  ? "Depends on recruitment readiness."
                  : m.name === "Insight Review"
                    ? "Depends on completed analysis."
                    : m.name === "Final Report"
                      ? "Depends on approvals."
                      : "Next step builds on prior milestone."}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Estimated delivery</h2>
        <p className="mt-2 text-sm text-gray-600">
          Target delivery date:{" "}
          {data.milestones.length
            ? new Date(data.milestones[data.milestones.length - 1].dueDate).toLocaleDateString()
            : "TBD"}
        </p>
        <p className="mt-2 text-xs text-gray-500">
          Estimates are based on current milestone schedules and may change as scope evolves.
        </p>
      </section>

      {data.localizationReadiness && data.localizationReadiness.length > 0 && (
        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Global readiness</h2>
          <p className="mt-2 text-sm text-gray-600">
            Localization checklist progress for active studies.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {data.localizationReadiness.map((item) => (
              <div key={item.studyId} className="rounded-xl border border-gray-100 p-4">
                <div className="text-xs uppercase text-gray-500">
                  Study {item.studyId}
                </div>
                <div className="mt-1 text-sm text-gray-700">
                  Language: {item.language?.toUpperCase() ?? "EN"}
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-gray-100">
                  <div
                    className="h-2 rounded-full bg-brand-500"
                    style={{ width: `${item.readinessPercent}%` }}
                  />
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {item.readinessPercent}% ready
                </div>
                {item.missing.length > 0 ? (
                  <ul className="mt-2 space-y-1 text-xs text-gray-600">
                    {item.missing.map((missing) => (
                      <li key={missing}>Missing: {formatChecklistKey(missing)}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs text-emerald-600">All localization checks complete.</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {data.recruitmentReadiness && data.recruitmentReadiness.length > 0 && (
        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Recruitment readiness</h2>
          <p className="mt-2 text-sm text-gray-600">
            Status for recruiting participants across active studies.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {data.recruitmentReadiness.map((item) => (
              <div key={item.studyId} className="rounded-xl border border-gray-100 p-4">
                <div className="text-xs uppercase text-gray-500">Study {item.studyId}</div>
                <div className="mt-2 h-2 w-full rounded-full bg-gray-100">
                  <div
                    className="h-2 rounded-full bg-brand-500"
                    style={{ width: `${item.readinessPercent}%` }}
                  />
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {item.readinessPercent}% ready
                </div>
                {item.missing.length > 0 ? (
                  <ul className="mt-2 space-y-1 text-xs text-gray-600">
                    {item.missing.map((missing) => (
                      <li key={missing}>Missing: {formatChecklistKey(missing)}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs text-emerald-600">Recruitment checklist complete.</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {data.activationReadiness && data.activationReadiness.length > 0 && (
        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Activation readiness</h2>
          <p className="mt-2 text-sm text-gray-600">
            Distribution and measurement plan status for each study.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {data.activationReadiness.map((item) => (
              <div key={item.studyId} className="rounded-xl border border-gray-100 p-4">
                <div className="text-xs uppercase text-gray-500">Study {item.studyId}</div>
                <div className="mt-2 h-2 w-full rounded-full bg-gray-100">
                  <div
                    className="h-2 rounded-full bg-brand-500"
                    style={{ width: `${item.readinessPercent}%` }}
                  />
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {item.readinessPercent}% ready
                </div>
                {item.missing.length > 0 ? (
                  <ul className="mt-2 space-y-1 text-xs text-gray-600">
                    {item.missing.map((missing) => (
                      <li key={missing}>Missing: {formatChecklistKey(missing)}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs text-emerald-600">Activation plan complete.</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {data.rolloutReadiness && data.rolloutReadiness.length > 0 && (
        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Market rollout</h2>
          <p className="mt-2 text-sm text-gray-600">
            Rollout status by market for each study.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {data.rolloutReadiness.map((item) => (
              <div key={item.studyId} className="rounded-xl border border-gray-100 p-4">
                <div className="text-xs uppercase text-gray-500">Study {item.studyId}</div>
                <div className="mt-2 text-sm text-gray-700">Status: {item.status}</div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                  {item.markets.length === 0 ? (
                    <span className="rounded-full border border-gray-200 px-2 py-1">No markets set</span>
                  ) : (
                    item.markets.map((market) => (
                      <span key={market} className="rounded-full border border-gray-200 px-2 py-1">
                        {market}
                      </span>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {data.distributionTracking && data.distributionTracking.length > 0 && (
        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Distribution tracking</h2>
          <p className="mt-2 text-sm text-gray-600">
            Channels and measurement signals for activated insights.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {data.distributionTracking.map((item) => (
              <div key={item.studyId} className="rounded-xl border border-gray-100 p-4">
                <div className="text-xs uppercase text-gray-500">Study {item.studyId}</div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                  {item.channels.length === 0 ? (
                    <span className="rounded-full border border-gray-200 px-2 py-1">No channels set</span>
                  ) : (
                    item.channels.map((channel) => (
                      <span key={channel} className="rounded-full border border-gray-200 px-2 py-1">
                        {channel}
                      </span>
                    ))
                  )}
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  Measurement: {item.measurement || "Not set"}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {data.deliveryHealth && data.deliveryHealth.length > 0 && (
        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Delivery health</h2>
          <p className="mt-2 text-sm text-gray-600">
            Overall delivery health across readiness, rollout, and activation.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {data.deliveryHealth.map((item) => (
              <div key={item.studyId} className="rounded-xl border border-gray-100 p-4">
                <div className="text-xs uppercase text-gray-500">Study {item.studyId}</div>
                <div className="mt-2 text-sm text-gray-700">
                  Status: {item.status} · Score {item.score}
                </div>
                {item.notes && (
                  <div className="mt-2 text-xs text-gray-600">Notes: {item.notes}</div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {data.activationMetrics && data.activationMetrics.length > 0 && (
        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Activation KPIs</h2>
          <p className="mt-2 text-sm text-gray-600">
            Engagement metrics for deliverables across activated assets.
          </p>
          <select
            value={activationFilter}
            onChange={(event) => setActivationFilter(event.target.value)}
            className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs"
          >
            <option value="all">All deliverables</option>
            <option value="deliverable_pack">Deliverable pack</option>
            <option value="report">Report</option>
            <option value="story">Story</option>
          </select>
          {(() => {
            const filteredMetrics =
              activationFilter === "all"
                ? data.activationMetrics
                : data.activationMetrics.filter((metric) => metric.deliverableType === activationFilter);
            const totals = filteredMetrics.reduce(
              (acc, metric) => {
                acc.views += metric.views ?? 0;
                acc.shares += metric.shares ?? 0;
                acc.decisions += metric.decisionsLogged ?? 0;
                return acc;
              },
              { views: 0, shares: 0, decisions: 0 },
            );
            return (
              <>
                <div className="mt-4 grid gap-3 md:grid-cols-3 text-xs text-gray-600">
                  <div className="rounded-lg border border-gray-100 p-3">Views: {totals.views}</div>
                  <div className="rounded-lg border border-gray-100 p-3">Shares: {totals.shares}</div>
                  <div className="rounded-lg border border-gray-100 p-3">
                    Decisions: {totals.decisions}
                  </div>
                </div>
                {activationTotals && Object.keys(activationTotals.byType).length > 0 && (
                  <div className="mt-4 text-xs text-gray-600">
                    {Object.entries(activationTotals.byType).map(([key, value]) => (
                      <div key={key} className="mt-1">
                        {key}: {value.views} views · {value.shares} shares · {value.decisions} decisions
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-4 text-xs text-gray-600">
                  <div className="text-[11px] uppercase text-gray-500">Weekly trend</div>
                  {(() => {
                    const byWeek = filteredMetrics.reduce<
                      Record<string, { views: number; shares: number; decisions: number }>
                    >((acc, metric) => {
                      const date = new Date(metric.updatedAt);
                      const day = date.getUTCDay() || 7;
                      const start = new Date(
                        Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
                      );
                      start.setUTCDate(start.getUTCDate() - day + 1);
                      const week = start.toISOString().slice(0, 10);
                      acc[week] = acc[week] ?? { views: 0, shares: 0, decisions: 0 };
                      acc[week].views += metric.views ?? 0;
                      acc[week].shares += metric.shares ?? 0;
                      acc[week].decisions += metric.decisionsLogged ?? 0;
                      return acc;
                    }, {});
                    return Object.entries(byWeek)
                      .sort(([a], [b]) => (a < b ? -1 : 1))
                      .map(([week, values]) => (
                        <div key={week} className="mt-1">
                          Week {week}: {values.views} views · {values.shares} shares · {values.decisions} decisions
                        </div>
                      ));
                  })()}
                </div>
              </>
            );
          })()}
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {(activationFilter === "all"
              ? data.activationMetrics
              : data.activationMetrics.filter((metric) => metric.deliverableType === activationFilter)
            ).map((metric) => (
              <div key={metric.id} className="rounded-xl border border-gray-100 p-4">
                <div className="text-xs uppercase text-gray-500">
                  {metric.deliverableType} · {metric.deliverableId ?? "n/a"}
                </div>
                <div className="mt-2 text-sm text-gray-700">
                  Views {metric.views} · Shares {metric.shares} · Decisions {metric.decisionsLogged}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  Updated {new Date(metric.updatedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {data.activationMetrics && data.activationMetrics.length > 0 && (
        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Share insights</h2>
          <p className="mt-2 text-sm text-gray-600">
            Where deliverables are being shared and adopted across studies.
          </p>
          {(() => {
            const byType = data.activationMetrics.reduce<Record<string, { shares: number; views: number }>>(
              (acc, metric) => {
                const key = metric.deliverableType ?? "unknown";
                acc[key] = acc[key] ?? { shares: 0, views: 0 };
                acc[key].shares += metric.shares ?? 0;
                acc[key].views += metric.views ?? 0;
                return acc;
              },
              {},
            );
            const byStudy = data.activationMetrics.reduce<Record<string, { shares: number; views: number }>>(
              (acc, metric) => {
                const key = metric.studyId ?? "unassigned";
                acc[key] = acc[key] ?? { shares: 0, views: 0 };
                acc[key].shares += metric.shares ?? 0;
                acc[key].views += metric.views ?? 0;
                return acc;
              },
              {},
            );
            const weeklyShares = data.activationMetrics.reduce<Record<string, { shares: number; views: number }>>(
              (acc, metric) => {
                const date = new Date(metric.updatedAt);
                const day = date.getUTCDay() || 7;
                const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
                start.setUTCDate(start.getUTCDate() - day + 1);
                const week = start.toISOString().slice(0, 10);
                acc[week] = acc[week] ?? { shares: 0, views: 0 };
                acc[week].shares += metric.shares ?? 0;
                acc[week].views += metric.views ?? 0;
                return acc;
              },
              {},
            );
            const feedbackItems = Object.entries(feedbackSummary)
              .map(([key, value]) => ({ key, ...value }))
              .filter((item) => typeof item.avgRating === "number");
            const recentRatings = feedbackItems
              .map((item) => item.avgRating as number)
              .slice(0, 4);
            const feedbackAvg =
              recentRatings.length > 0
                ? Math.round(
                    (recentRatings.reduce((sum, rating) => sum + rating, 0) / recentRatings.length) * 10,
                  ) / 10
                : null;
            const feedbackDelta =
              recentRatings.length > 2
                ? Math.round(((recentRatings[0] - recentRatings[recentRatings.length - 1]) || 0) * 10) / 10
                : null;
            const recentWeeks = Object.entries(weeklyShares)
              .sort(([a], [b]) => (a < b ? -1 : 1))
              .slice(-4);
            const maxShares = Math.max(1, ...recentWeeks.map(([, value]) => value.shares));
            const lastWeekShares = recentWeeks.length ? recentWeeks[recentWeeks.length - 1][1].shares : 0;
            const prevWeekShares = recentWeeks.length > 1 ? recentWeeks[recentWeeks.length - 2][1].shares : 0;
            const shareDelta = lastWeekShares - prevWeekShares;
            const momentumTone = shareDelta > 0 ? "emerald" : shareDelta < 0 ? "rose" : "gray";
            return (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-gray-100 p-4">
                  <div className="text-xs uppercase text-gray-500">By deliverable type</div>
                  <ul className="mt-3 space-y-2 text-sm text-gray-700">
                    {Object.entries(byType).map(([key, value]) => (
                      <li key={key} className="flex items-center justify-between">
                        <span>{key.replace(/_/g, " ")}</span>
                        <span className="text-xs text-gray-500">
                          {value.shares} shares · {value.views} views
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-gray-100 p-4">
                  <div className="text-xs uppercase text-gray-500">By study</div>
                  <ul className="mt-3 space-y-2 text-sm text-gray-700">
                    {Object.entries(byStudy).map(([key, value]) => (
                      <li key={key} className="flex items-center justify-between">
                        <span>Study {key}</span>
                        <span className="text-xs text-gray-500">
                          {value.shares} shares · {value.views} views
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-gray-100 p-4 md:col-span-2">
                  <div className="text-xs uppercase text-gray-500">Share trend (last 4 weeks)</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        momentumTone === "emerald"
                          ? "bg-emerald-100 text-emerald-700"
                          : momentumTone === "rose"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-gray-100 text-gray-600"
                      }`}
                      title="Compares shares in the most recent week to the previous week."
                    >
                      {shareDelta > 0 ? `▲ +${shareDelta}` : shareDelta < 0 ? `▼ ${shareDelta}` : "No change"}
                    </span>
                    <span>Week-over-week share momentum</span>
                    {feedbackAvg !== null && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          feedbackDelta !== null
                            ? feedbackDelta > 0
                              ? "bg-emerald-100 text-emerald-700"
                              : feedbackDelta < 0
                                ? "bg-rose-100 text-rose-700"
                                : "bg-gray-100 text-gray-600"
                            : "bg-gray-100 text-gray-600"
                        }`}
                        title="Average of recent feedback ratings."
                      >
                        Feedback {feedbackAvg}
                        {feedbackDelta !== null && feedbackDelta !== 0 ? ` (${feedbackDelta > 0 ? "+" : ""}${feedbackDelta})` : ""}
                      </span>
                    )}
                  </div>
                  {feedbackItems.length > 0 && (
                    <ul className="mt-3 space-y-2 text-xs text-gray-600">
                      {feedbackItems.slice(0, 4).map((item) => (
                        <li key={item.key} className="flex items-center justify-between">
                          <span>{item.key.replace(/_/g, " ")}</span>
                          <span className="text-[11px] text-gray-500">
                            {item.avgRating ?? "n/a"} avg · {item.total} responses
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <ul className="mt-3 space-y-2 text-xs text-gray-600">
                    {recentWeeks.map(([week, value]) => (
                      <li key={week} className="flex items-center gap-2">
                        <span className="w-24 text-[11px] text-gray-500">{week}</span>
                        <div className="h-2 flex-1 rounded-full bg-gray-100">
                          <div
                            className="h-2 rounded-full bg-brand-400"
                            style={{ width: `${Math.round((value.shares / maxShares) * 100)}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-gray-500">{value.shares} shares</span>
                      </li>
                    ))}
                    {recentWeeks.length === 0 && (
                      <li className="text-xs text-gray-500">No share activity yet.</li>
                    )}
                  </ul>
                </div>
                <div className="rounded-xl border border-gray-100 p-4 md:col-span-2">
                  <div className="text-xs uppercase text-gray-500">Top shared deliverables</div>
                  <ul className="mt-3 space-y-2 text-sm text-gray-700">
                    {data.activationMetrics
                      .slice()
                      .sort((a, b) => (b.shares ?? 0) - (a.shares ?? 0))
                      .slice(0, 5)
                      .map((metric) => (
                        <li key={metric.id} className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs text-gray-600">
                            {metric.deliverableType.replace(/_/g, " ")} · {metric.deliverableId ?? "n/a"}
                          </span>
                          <span className="text-xs text-gray-500">
                            {metric.shares} shares · {metric.views} views
                          </span>
                          <div className="flex flex-wrap gap-2 text-xs text-brand-600">
                            {metric.deliverableType === "story" && metric.deliverableId && (
                              <a
                                href={`${API_BASE}/exports/story/${metric.deliverableId}/pdf`}
                                className="hover:underline"
                              >
                                View story
                              </a>
                            )}
                            {metric.deliverableType === "report" && metric.studyId && (
                              <a
                                href={`${API_BASE}/exports/study/${metric.studyId}/pdf`}
                                className="hover:underline"
                              >
                                View report
                              </a>
                            )}
                          </div>
                        </li>
                      ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 md:col-span-2">
                  <div className="text-xs uppercase text-amber-700">Share recommendations</div>
                  <ul className="mt-3 space-y-2 text-sm text-amber-900">
                    {data.activationMetrics
                      .slice()
                      .sort((a, b) => (a.shares ?? 0) - (b.shares ?? 0))
                      .filter((metric) => (metric.shares ?? 0) <= 1)
                      .slice(0, 3)
                      .map((metric) => {
                        const action =
                          metric.deliverableType === "report"
                            ? "Share the report summary with decision makers."
                            : metric.deliverableType === "story"
                              ? "Send the story reel to internal comms."
                              : "Include this deliverable in the executive update.";
                        return (
                          <li key={metric.id} className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs text-amber-900">
                              {metric.deliverableType.replace(/_/g, " ")} · {metric.deliverableId ?? "n/a"}
                            </span>
                            <span className="text-[11px] text-amber-800">
                              {metric.shares} shares · {metric.views} views
                            </span>
                            <span className="text-[11px] text-amber-800">{action}</span>
                          </li>
                        );
                      })}
                    {data.activationMetrics.filter((metric) => (metric.shares ?? 0) <= 1).length === 0 && (
                      <li className="text-xs text-amber-800">No low-share deliverables detected.</li>
                    )}
                  </ul>
                </div>
                <div className="rounded-xl border border-gray-100 p-4 md:col-span-2">
                  <div className="text-xs uppercase text-gray-500">Share checklist</div>
                  <div className="mt-3 grid gap-3 text-xs text-gray-600 md:grid-cols-3">
                    <div className="rounded-lg border border-gray-100 p-3">
                      <div className="text-[11px] font-semibold text-gray-700">Report</div>
                      <ul className="mt-2 space-y-1">
                        {[
                          { id: "report-summary", label: "Send executive summary to leaders." },
                          { id: "report-evidence", label: "Attach evidence bundle to deck." },
                          { id: "report-top-insights", label: "Highlight top 3 insights." },
                        ].map((item) => (
                          <li key={item.id} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={shareChecklist[item.id] ?? false}
                              onChange={(event) => {
                                const next = { ...shareChecklist, [item.id]: event.target.checked };
                                void saveShareChecklist(next);
                              }}
                              className="h-3 w-3"
                            />
                            <span>{item.label}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-lg border border-gray-100 p-3">
                      <div className="text-[11px] font-semibold text-gray-700">Story</div>
                      <ul className="mt-2 space-y-1">
                        {[
                          { id: "story-comms", label: "Share story reel in internal comms." },
                          { id: "story-audio", label: "Post audio recap in updates." },
                          { id: "story-tags", label: "Tag relevant stakeholders." },
                        ].map((item) => (
                          <li key={item.id} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={shareChecklist[item.id] ?? false}
                              onChange={(event) => {
                                const next = { ...shareChecklist, [item.id]: event.target.checked };
                                void saveShareChecklist(next);
                              }}
                              className="h-3 w-3"
                            />
                            <span>{item.label}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-lg border border-gray-100 p-3">
                      <div className="text-[11px] font-semibold text-gray-700">Deliverable pack</div>
                      <ul className="mt-2 space-y-1">
                        {[
                          { id: "pack-distribute", label: "Distribute approved pack link." },
                          { id: "pack-feedback", label: "Collect feedback ratings." },
                          { id: "pack-decisions", label: "Log decisions influenced." },
                        ].map((item) => (
                          <li key={item.id} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={shareChecklist[item.id] ?? false}
                              onChange={(event) => {
                                const next = { ...shareChecklist, [item.id]: event.target.checked };
                                void saveShareChecklist(next);
                              }}
                              className="h-3 w-3"
                            />
                            <span>{item.label}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500">
                    <span>
                      Completed {Object.values(shareChecklist).filter(Boolean).length} of 9 actions
                      {shareChecklistUpdatedAt && (
                        <> · Updated {shareChecklistUpdatedAt.toLocaleDateString()}</>
                      )}
                      {shareChecklistSaving && <> · Saving…</>}
                      {shareChecklistError && <> · {shareChecklistError}</>}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        void saveShareChecklist({});
                      }}
                      className="text-brand-600 hover:underline"
                    >
                      Reset checklist
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </section>
      )}

      {(activationByStudy || Object.keys(feedbackByStudy).length > 0) && (
        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Adoption alerts</h2>
          <p className="mt-2 text-sm text-gray-600">
            Flags for low engagement or feedback so you can follow up quickly.
          </p>
          <div className="mt-4 space-y-2 text-sm text-gray-700">
            {Object.entries(activationByStudy ?? {}).map(([studyId, metrics]) => (
              <div key={studyId} className="rounded-lg border border-gray-100 p-3">
                Study {studyId} · Views {metrics.views} · Shares {metrics.shares}
                {metrics.views < lowActivationThreshold && (
                  <span className="ml-2 text-xs text-amber-600">
                    Low activation volume
                  </span>
                )}
              </div>
            ))}
            {Object.entries(feedbackByStudy).map(([studyId, summary]) => (
              <div key={studyId} className="rounded-lg border border-gray-100 p-3">
                Study {studyId} · Feedback {summary.total} · Avg {summary.avgRating ?? "n/a"}
                {summary.avgRating !== null && summary.avgRating < lowFeedbackThreshold && (
                  <span className="ml-2 text-xs text-rose-600">Low feedback score</span>
                )}
              </div>
            ))}
            {Object.keys(activationByStudy ?? {}).length === 0 &&
              Object.keys(feedbackByStudy).length === 0 && (
                <p className="text-xs text-gray-500">No alerts yet.</p>
              )}
          </div>
        </section>
      )}

      {clientNotifications.length > 0 && (
        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Recent updates</h2>
            <div className="flex flex-wrap gap-2">
              <input
                value={notificationFilter}
                onChange={(event) => setNotificationFilter(event.target.value)}
                placeholder="Filter by type"
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
              <select
                value={deliverableFilter}
                onChange={(event) => setDeliverableFilter(event.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="all">All deliverables</option>
                <option value="deliverable_pack">Deliverable pack</option>
                <option value="report">Report</option>
                <option value="story">Story</option>
              </select>
              <select
                value={alertSeverityFilter}
                onChange={(event) => setAlertSeverityFilter(event.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="all">All severities</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          <ul className="mt-3 space-y-2 text-sm text-gray-700">
            {clientNotifications
              .filter((note) =>
                note.type.toLowerCase().includes(notificationFilter.trim().toLowerCase()),
              )
              .filter((note) => {
                if (deliverableFilter === "all") return true;
                const payloadType =
                  (typeof note.payload?.approvalType === "string" && note.payload.approvalType) ||
                  (typeof note.payload?.deliverableType === "string" && note.payload.deliverableType) ||
                  "";
                return payloadType === deliverableFilter;
              })
              .filter((note) => {
                if (alertSeverityFilter === "all") return true;
                if (note.type !== "adoption.alert") return true;
                const avgRating =
                  typeof note.payload?.avgRating === "number" ? (note.payload.avgRating as number) : null;
                const threshold =
                  typeof note.payload?.feedbackScoreThreshold === "number"
                    ? (note.payload.feedbackScoreThreshold as number)
                    : null;
                const severity =
                  avgRating !== null && threshold !== null && avgRating < threshold ? "critical" : "warning";
                return severity === alertSeverityFilter;
              })
              .map((note) => (
                <li key={note.id} className="rounded-lg border border-gray-100 p-3">
                  {(note.type === "approval.requested" && "Approval requested") ||
                    (note.type === "approval.decision" && "Approval decision") ||
                    (note.type === "task.overdue" && "Task overdue") ||
                    (note.type === "embed.completed" && "Interview completed") ||
                    (note.type === "deliverable.pack.ready" && "Deliverable pack ready") ||
                    (note.type === "adoption.alert" && "Adoption alert") ||
                    note.type}
                  {" · "}
                  {new Date(note.createdAt).toLocaleDateString()}
                  {" "}
                  {typeof note.payload?.approvalId === "string" && (
                    <Link
                      href={`/client/approvals/${note.payload.approvalId}`}
                      className="ml-2 text-xs text-brand-600 hover:underline"
                    >
                      Review →
                    </Link>
                  )}
                  {note.type === "adoption.alert" && (
                    <span className="ml-2 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
                      Alert
                    </span>
                  )}
                </li>
              ))}
          </ul>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-gray-100 p-3 text-xs text-gray-600">
              <div className="uppercase text-gray-500">Approvals</div>
              <div className="mt-1 text-sm font-semibold text-gray-900">
                {
                  clientNotifications.filter((note) => note.type.startsWith("approval.")).length
                }
              </div>
            </div>
            <div className="rounded-xl border border-gray-100 p-3 text-xs text-gray-600">
              <div className="uppercase text-gray-500">Interviews</div>
              <div className="mt-1 text-sm font-semibold text-gray-900">
                {clientNotifications.filter((note) => note.type === "embed.completed").length}
              </div>
            </div>
            <div className="rounded-xl border border-gray-100 p-3 text-xs text-gray-600">
              <div className="uppercase text-gray-500">Tasks</div>
              <div className="mt-1 text-sm font-semibold text-gray-900">
                {clientNotifications.filter((note) => note.type.startsWith("task.")).length}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Delivery status</h2>
        <p className="mt-2 text-sm text-gray-600">
          {data.milestones.some((m) => m.status !== "done" && new Date(m.dueDate) < new Date())
            ? "Some milestones are at risk. We'll keep you updated."
            : "Delivery is on track based on current milestones."}
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {data.milestones.map((m) => (
            <div key={`${m.name}-status`} className="rounded-xl border border-gray-100 p-4 text-sm">
              <div className="text-xs uppercase text-gray-500">{m.name}</div>
              <div className="mt-1 text-base font-semibold text-gray-900">{m.status}</div>
              <div className="mt-1 text-xs text-gray-500">
                Due {new Date(m.dueDate).toLocaleDateString()}
              </div>
              <div className="mt-2">
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    m.status === "done"
                      ? "bg-emerald-100 text-emerald-700"
                      : m.status === "blocked"
                        ? "bg-rose-100 text-rose-700"
                        : m.status === "in_progress"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {m.status === "done"
                    ? "Complete"
                    : m.status === "blocked"
                      ? "Blocked"
                      : m.status === "in_progress"
                        ? "In progress"
                        : "Not started"}
                </span>
                {m.status !== "done" && new Date(m.dueDate) < new Date() && (
                  <span className="ml-2 rounded-full bg-rose-100 px-2 py-1 text-xs font-medium text-rose-700">
                    At risk
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Approved deliverables</h2>
        <ul className="mt-3 space-y-2">
          {data.approvedDeliverables.map((d, i) => (
            <li key={i} className="text-sm">
              <span className="font-medium">{d.type}</span> · {d.id}
            </li>
          ))}
        </ul>
      </section>

      {report && (
        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Report summary</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-gray-100 p-4">
              <p className="text-xs uppercase text-gray-500">Segment summary</p>
              <div className="mt-2 space-y-1 text-sm text-gray-700">
                {Object.entries(report.segmentSummary ?? {}).map(([segment, count]) => (
                  <div key={segment} className="flex justify-between">
                    <span>{segment}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-gray-100 p-4">
              <p className="text-xs uppercase text-gray-500">Theme quantification</p>
              <div className="mt-2 space-y-1 text-sm text-gray-700">
                {Object.entries(report.themeQuantification ?? {}).map(([label, count]) => (
                  <div key={label} className="flex justify-between">
                    <span>{label}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {data.studyIds?.[0] && (
            <div className="mt-4 flex flex-wrap gap-3 text-xs">
              <a
                href={`${API_BASE}/exports/study/${data.studyIds[0]}/markdown`}
                className="text-brand-600 hover:underline"
              >
                Download Markdown →
              </a>
              <Link
                href={`/client/reports?studyId=${data.studyIds[0]}`}
                className="text-brand-600 hover:underline"
              >
                View client report →
              </Link>
              <Link href="/client/audit" className="text-brand-600 hover:underline">
                View audit log →
              </Link>
              <a
                href={`${API_BASE}/exports/study/${data.studyIds[0]}/json`}
                className="text-brand-600 hover:underline"
              >
                Download JSON →
              </a>
              <a
                href={`${API_BASE}/exports/study/${data.studyIds[0]}/ppt-outline`}
                className="text-brand-600 hover:underline"
              >
                Download PPT outline →
              </a>
              <a
                href={`${API_BASE}/exports/study/${data.studyIds[0]}/evidence-bundle.csv`}
                className="text-brand-600 hover:underline"
              >
                Download evidence bundle →
              </a>
            </div>
          )}
        </section>
      )}

      {pendingApprovals.length > 0 && (
        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Approvals</h2>
          <p className="mt-2 text-sm text-gray-600">
            {pendingApprovals.length} approval{pendingApprovals.length === 1 ? "" : "s"} waiting for review.
          </p>
          <Link
            href="/client/approvals"
            className="mt-3 inline-block text-xs text-brand-600 hover:underline"
          >
            Review approvals →
          </Link>
        </section>
      )}

      <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Stakeholder feedback</h2>
        <p className="mt-2 text-sm text-gray-600">
          Capture stakeholder reactions to deliverables to drive adoption and follow-up work.
        </p>
        <textarea
          value={feedbackNote}
          onChange={(event) => setFeedbackNote(event.target.value)}
          className="mt-3 w-full rounded-lg border border-gray-200 p-3 text-sm"
          rows={3}
          placeholder="What resonated? What needs follow-up?"
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
        {Object.keys(feedbackSummary).length > 0 && (
          <div className="mt-3 text-xs text-gray-600">
            <div className="text-[11px] uppercase text-gray-500">Feedback by deliverable</div>
            {Object.entries(feedbackSummary).map(([key, value]) => (
              <div key={key} className="mt-1">
                {key}: {value.total} responses · Avg {value.avgRating ?? "n/a"}
              </div>
            ))}
          </div>
        )}
        {Object.keys(feedbackByStudy).length > 0 && (
          <div className="mt-3 text-xs text-gray-600">
            <div className="text-[11px] uppercase text-gray-500">Feedback by study</div>
            {Object.entries(feedbackByStudy).map(([key, value]) => (
              <div key={key} className="mt-1">
                {key}: {value.total} responses · Avg {value.avgRating ?? "n/a"}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Approvals summary</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-gray-100 p-4 text-sm">
            <div className="text-xs uppercase text-gray-500">Pending</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">{pendingApprovals.length}</div>
          </div>
          <div className="rounded-xl border border-gray-100 p-4 text-sm">
            <div className="text-xs uppercase text-gray-500">Recent approvals</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">
              {clientNotifications.filter((note) => note.type === "approval.decision").length}
            </div>
          </div>
          <div className="rounded-xl border border-gray-100 p-4 text-sm">
            <div className="text-xs uppercase text-gray-500">Approval requests</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">
              {clientNotifications.filter((note) => note.type === "approval.requested").length}
            </div>
          </div>
        </div>
      </section>

      {reportMarkdown && (
        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Report preview</h2>
          <pre className="mt-3 whitespace-pre-wrap text-sm text-gray-700">{reportMarkdown}</pre>
        </section>
      )}

      {stories.length > 0 && (
        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Stories</h2>
          <p className="mt-2 text-sm text-gray-600">
            Activation-ready narratives for sharing insights as articles, video reels, or podcasts.
          </p>
          <div className="mt-4 rounded-xl border border-gray-100 p-4 text-sm text-gray-600">
            <div className="text-xs uppercase text-gray-500">Activation checklist</div>
            <ul className="mt-3 space-y-1 text-xs text-gray-600">
              <li>Share executive brief with decision makers.</li>
              <li>Publish story reel clips to internal comms.</li>
              <li>Distribute audio recap to stakeholder channels.</li>
              <li>Attach evidence bundle to slide deck.</li>
            </ul>
          </div>
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

      {exportHistory.length > 0 && (
        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Export history</h2>
          <ul className="mt-3 space-y-2 text-sm text-gray-700">
            {exportHistory.map((exportItem) => (
              <li key={exportItem.id} className="rounded-lg border border-gray-100 p-3">
                {exportItem.type ?? "report"} · {exportItem.id}
                {exportItem.createdAt && (
                  <span> · {new Date(exportItem.createdAt).toLocaleDateString()}</span>
                )}
                <div className="mt-2 text-xs text-brand-600">
                  <a
                    href={`${API_BASE}/exports/study/${data.studyIds?.[0]}/markdown`}
                    className="hover:underline"
                  >
                    Markdown
                  </a>
                  {" · "}
                  <a
                    href={`${API_BASE}/exports/study/${data.studyIds?.[0]}/pdf`}
                    className="hover:underline"
                  >
                    PDF
                  </a>
                  {" · "}
                  <a
                    href={`${API_BASE}/exports/study/${data.studyIds?.[0]}/ppt-outline`}
                    className="hover:underline"
                  >
                    PPT outline
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {analysisDelivery && (
        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Analysis delivery</h2>
          <p className="mt-2 text-sm text-gray-600">
            Consolidated delivery view of approved insights, evidence, and exports.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
            {lastDeliveryDate && <span>Last delivered {lastDeliveryDate.toLocaleDateString()}</span>}
            {targetDeliveryDate && <span>Target delivery {targetDeliveryDate.toLocaleDateString()}</span>}
            {deliveryHealth && (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  deliveryHealth.tone === "rose"
                    ? "bg-rose-100 text-rose-700"
                    : deliveryHealth.tone === "emerald"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                }`}
              >
                {deliveryHealth.label}
              </span>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
            <select
              value={deliveryFilter}
              onChange={(event) => setDeliveryFilter(event.target.value)}
              className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
            >
              <option value="all">All types</option>
              <option value="report_export">Reports</option>
              <option value="story">Stories</option>
              <option value="insight">Insights</option>
            </select>
            <select
              value={deliverySort}
              onChange={(event) => setDeliverySort(event.target.value)}
              className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="type">Group by type</option>
            </select>
          </div>
          <div className="mt-4 grid gap-3 text-xs text-gray-600 md:grid-cols-4">
            <div className="rounded-lg border border-gray-100 p-3">
              Insights: {analysisDelivery.insights.length}
            </div>
            <div className="rounded-lg border border-gray-100 p-3">
              Stories: {analysisDelivery.stories.length}
            </div>
            <div className="rounded-lg border border-gray-100 p-3">
              Reports: {analysisDelivery.exports.length}
            </div>
            <div className="rounded-lg border border-gray-100 p-3">
              Evidence clips: {analysisDelivery.evidenceClips.length}
            </div>
          </div>
          {pendingApprovalCounts.total > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-amber-700">
              <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold">
                Awaiting approvals: {pendingApprovalCounts.total}
              </span>
              {Object.entries(pendingApprovalCounts.byType).map(([key, value]) => (
                <span key={key} className="rounded-full bg-amber-50 px-2 py-0.5">
                  {key.replace(/_/g, " ")}: {value}
                </span>
              ))}
            </div>
          )}
          {pendingApprovalCounts.total > 0 && (
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              {(analysisDelivery.approvals ?? [])
                .filter((approval) => approval.status === "requested")
                .slice(0, pendingVisibleCount)
                .map((approval) => (
                  <li key={approval.id} className="rounded-lg border border-amber-100 bg-amber-50 p-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-amber-700">
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold">Pending</span>
                      <span className="uppercase">{approval.linkedEntityType.replace(/_/g, " ")}</span>
                      <Link
                        href={`/client/approvals/${approval.id}`}
                        className="text-[11px] text-brand-600 hover:underline"
                      >
                        Review →
                      </Link>
                    </div>
                  </li>
                ))}
            </ul>
          )}
          {pendingApprovalCounts.total > pendingVisibleCount && (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setPendingVisibleCount((count) => count + 6)}
                className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600"
              >
                Show more pending approvals
              </button>
            </div>
          )}
          {analysisDelivery.timeline.length > 0 ? (
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              {analysisDelivery.timeline
                .filter((entry) => (deliveryFilter === "all" ? true : entry.type === deliveryFilter))
                .sort((a, b) => {
                  if (deliverySort === "oldest") {
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                  }
                  if (deliverySort === "type") {
                    return a.type.localeCompare(b.type);
                  }
                  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                })
                .slice(0, timelineVisibleCount)
                .map((entry, index) => (
                <li
                  key={`${entry.type}-${entry.id}`}
                  className={`rounded-lg border p-3 ${
                    index === 0 && deliverySort === "newest" ? "border-brand-200 bg-brand-50" : "border-gray-100"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span className="uppercase">{entry.type.replace(/_/g, " ")}</span>
                    {(() => {
                      const approval = getApprovalForEntry(entry);
                      if (!approval) return null;
                      const isApproved = approval.status === "approved";
                      const badgeClass = isApproved
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700";
                      const label = isApproved ? "Approved" : "Pending";
                      return (
                        <>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeClass}`}>
                            {label}
                          </span>
                          <Link
                            href={`/client/approvals/${approval.id}`}
                            className="text-[11px] text-brand-600 hover:underline"
                          >
                            Review →
                          </Link>
                        </>
                      );
                    })()}
                  </div>
                  <div className="mt-1 text-sm text-gray-800">{entry.label}</div>
                  <div className="mt-1 text-xs text-gray-500">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-gray-500">Delivery events will appear once exports are generated.</p>
          )}
          {analysisDelivery.timeline.length > timelineVisibleCount && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setTimelineVisibleCount((count) => count + 8)}
                className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600"
              >
                Show more delivery events
              </button>
            </div>
          )}
          {(analysisDelivery.exports.length > 0 || analysisDelivery.stories.length > 0) && (
            <div className="mt-4 grid gap-3 text-sm text-gray-700 md:grid-cols-2">
              <div className="rounded-xl border border-gray-100 p-4">
                <div className="text-xs uppercase text-gray-500">Delivery bundle</div>
                <p className="mt-2 text-xs text-gray-600">
                  One-click access to the latest approved deliverables.
                </p>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-brand-600">
                  {analysisDelivery.exports[0] && (
                    <>
                      <a
                        href={`${API_BASE}/exports/study/${analysisDelivery.exports[0].studyId}/markdown`}
                        className="hover:underline"
                      >
                        Report (Markdown)
                      </a>
                      <a
                        href={`${API_BASE}/exports/study/${analysisDelivery.exports[0].studyId}/pdf`}
                        className="hover:underline"
                      >
                        Report (PDF)
                      </a>
                      <a
                        href={`${API_BASE}/exports/study/${analysisDelivery.exports[0].studyId}/ppt-outline`}
                        className="hover:underline"
                      >
                        Report (PPT outline)
                      </a>
                    </>
                  )}
                  {analysisDelivery.stories[0] && (
                    <>
                      <a
                        href={`${API_BASE}/exports/story/${analysisDelivery.stories[0].id}/markdown`}
                        className="hover:underline"
                      >
                        Story (Markdown)
                      </a>
                      <a
                        href={`${API_BASE}/exports/story/${analysisDelivery.stories[0].id}/pdf`}
                        className="hover:underline"
                      >
                        Story (PDF)
                      </a>
                      <a
                        href={`${API_BASE}/exports/story/${analysisDelivery.stories[0].id}/audio-script`}
                        className="hover:underline"
                      >
                        Story (Audio script)
                      </a>
                    </>
                  )}
                  {analysisDelivery.exports[0] && (
                    <a
                      href={`${API_BASE}/exports/study/${analysisDelivery.exports[0].studyId}/evidence-bundle.csv`}
                      className="hover:underline"
                    >
                      Evidence bundle (CSV)
                    </a>
                  )}
                </div>
              </div>
              {analysisDelivery.exports.length > 0 && (
                <div className="rounded-xl border border-gray-100 p-4">
                  <div className="text-xs uppercase text-gray-500">Approved reports</div>
                  <ul className="mt-2 space-y-2">
                    {analysisDelivery.exports.map((exportItem) => (
                      <li key={exportItem.id} className="rounded-lg border border-gray-100 p-3">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                            Approved
                          </span>
                          <span>{exportItem.type}</span>
                          <span>·</span>
                          <span>{new Date(exportItem.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="mt-2 text-xs text-brand-600">
                          <a
                            href={`${API_BASE}/exports/study/${exportItem.studyId}/markdown`}
                            className="hover:underline"
                          >
                            Markdown
                          </a>
                          {" · "}
                          <a
                            href={`${API_BASE}/exports/study/${exportItem.studyId}/pdf`}
                            className="hover:underline"
                          >
                            PDF
                          </a>
                          {" · "}
                          <a
                            href={`${API_BASE}/exports/study/${exportItem.studyId}/ppt-outline`}
                            className="hover:underline"
                          >
                            PPT outline
                          </a>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {analysisDelivery.stories.length > 0 && (
                <div className="rounded-xl border border-gray-100 p-4">
                  <div className="text-xs uppercase text-gray-500">Approved stories</div>
                  <ul className="mt-2 space-y-2">
                    {analysisDelivery.stories.map((story) => (
                      <li key={story.id} className="rounded-lg border border-gray-100 p-3">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                            Approved
                          </span>
                          <span className="uppercase">{story.type}</span>
                          {approvedDeliverableStudyIds.has(story.studyId) && (
                            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-600">
                              Deliverable pack
                            </span>
                          )}
                        </div>
                        <div className="mt-1 text-sm font-semibold text-gray-900">{story.title}</div>
                        {story.summary && <p className="mt-1 text-xs text-gray-600">{story.summary}</p>}
                        <div className="mt-2 text-xs text-brand-600">
                          <a
                            href={`${API_BASE}/exports/story/${story.id}/markdown`}
                            className="hover:underline"
                          >
                            Markdown
                          </a>
                          {" · "}
                          <a href={`${API_BASE}/exports/story/${story.id}/pdf`} className="hover:underline">
                            PDF
                          </a>
                          {" · "}
                          <a
                            href={`${API_BASE}/exports/story/${story.id}/audio-script`}
                            className="hover:underline"
                          >
                            Audio script
                          </a>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          {(analysisDelivery.risks.overdueMilestones.length > 0 ||
            analysisDelivery.risks.blockedTasks.length > 0 ||
            analysisDelivery.risks.overdueTasks.length > 0 ||
            analysisDelivery.risks.pendingApprovals.length > 0) && (
            <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900">
              <div className="text-xs uppercase text-amber-700">Delivery risks</div>
              <ul className="mt-2 space-y-2 text-xs text-amber-800">
                {analysisDelivery.risks.overdueMilestones.slice(0, 3).map((milestone) => (
                  <li key={milestone.id}>
                    Overdue milestone: {milestone.name} · due{" "}
                    {new Date(milestone.dueDate).toLocaleDateString()}
                  </li>
                ))}
                {analysisDelivery.risks.blockedTasks.slice(0, 3).map((task) => (
                  <li key={task.id}>
                    Blocked task: {task.title}
                    {task.blockedReason ? ` · ${task.blockedReason}` : ""}
                    {projectId && (
                      <>
                        {" "}
                        ·{" "}
                        <Link
                          href={`/projects/${projectId}?taskId=${task.id}`}
                          className="text-brand-600 hover:underline"
                        >
                          Resolve →
                        </Link>
                      </>
                    )}
                  </li>
                ))}
                {analysisDelivery.risks.overdueTasks.slice(0, 3).map((task) => (
                  <li key={task.id}>
                    Overdue task: {task.title}
                    {task.dueDate ? ` · due ${new Date(task.dueDate).toLocaleDateString()}` : ""}
                    {projectId && (
                      <>
                        {" "}
                        ·{" "}
                        <Link
                          href={`/projects/${projectId}?taskId=${task.id}`}
                          className="text-brand-600 hover:underline"
                        >
                          Resolve →
                        </Link>
                      </>
                    )}
                  </li>
                ))}
                {analysisDelivery.risks.pendingApprovals.slice(0, 3).map((approval) => (
                  <li key={approval.id}>
                    Pending approval: {approval.linkedEntityType.replace(/_/g, " ")} ·{" "}
                    <Link href={`/client/approvals/${approval.id}`} className="text-brand-600 hover:underline">
                      Review →
                    </Link>
                  </li>
                ))}
              </ul>
              {projectId && (
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-brand-600">
                  <Link href={`/projects/${projectId}`} className="hover:underline">
                    Resolve in project board →
                  </Link>
                  <Link href={`/ops/blocked`} className="hover:underline">
                    View blocked tasks →
                  </Link>
                  <Link href={`/ops/overdue`} className="hover:underline">
                    View overdue tasks →
                  </Link>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {evidenceBundle.length > 0 && data.studyIds?.[0] && (
        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Evidence bundle</h2>
          <a
            href={`${API_BASE}/exports/study/${data.studyIds[0]}/evidence-bundle.csv`}
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

      {report?.transcriptSnippets && report.transcriptSnippets.length > 0 && (
        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Quote highlights</h2>
          <ul className="mt-3 space-y-2 text-sm text-gray-700">
            {report.transcriptSnippets.map((snippet, index) => (
              <li key={`${snippet}-${index}`} className="rounded-lg border border-gray-100 p-3">
                “{snippet}”
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Insight headlines</h2>
          <input
            value={clientSearch}
            onChange={(event) => setClientSearch(event.target.value)}
            placeholder="Filter insights and clips"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
        <ul className="mt-3 space-y-2">
          {data.insightHeadlines
            .filter((h) =>
              h.statement.toLowerCase().includes(clientSearch.trim().toLowerCase()),
            )
            .map((h) => (
            <li key={h.id} className="rounded-lg border border-gray-100 p-3 text-sm">
              <Link href={`/client/insights/${h.id}`} className="text-brand-600 hover:underline">
                {h.statement}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-3 text-xs">
          <button
            type="button"
            onClick={async () => {
              if (!clientSearch.trim()) return;
              setSearchStatus("Searching...");
              const res = await fetch(`${API_BASE}/search/insights/query`, {
                method: "POST",
                headers: { ...HEADERS, "Content-Type": "application/json" },
                body: JSON.stringify({ query: clientSearch.trim(), studyId: data.studyIds?.[0] }),
              });
              if (!res.ok) {
                setSearchStatus("Search failed.");
                return;
              }
              const payload = await res.json();
              setSearchResults(payload.results ?? []);
              setSearchStatus(`Found ${payload.results?.length ?? 0} results.`);
            }}
            className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600"
          >
            Search insights
          </button>
          {searchStatus && <span className="self-center text-xs text-gray-500">{searchStatus}</span>}
        </div>
        {searchResults.length > 0 && (
          <ul className="mt-3 space-y-2 text-sm text-gray-700">
            {searchResults.map((result) => (
              <li key={result.id ?? result.statement} className="rounded-lg border border-gray-100 p-3">
                <Link href={`/client/insights/${result.id}`} className="text-brand-600 hover:underline">
                  {result.statement ?? "Insight"}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Evidence clips</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {data.evidenceClips
            .filter((clip) => {
              if (!clientSearch.trim()) return true;
              return (clip.transcriptSnippet ?? "")
                .toLowerCase()
                .includes(clientSearch.trim().toLowerCase());
            })
            .map((clip) => (
            <div key={clip.id} className="rounded-lg border border-gray-100 p-3 text-sm">
              <div className="flex items-center justify-between">
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
                    setSignedUrl(data?.url ?? null);
                  }}
                  className="text-xs text-brand-600 hover:underline"
                >
                  Play
                </button>
              </div>
              {clip.transcriptSnippet && (
                <p className="mt-2 text-xs text-gray-500">“{clip.transcriptSnippet}”</p>
              )}
              {clipThumbnails[clip.id] && (
                <img
                  src={clipThumbnails[clip.id]}
                  alt={`Clip ${clip.id} thumbnail`}
                  className="mt-3 h-40 w-full rounded-lg object-cover"
                />
              )}
            </div>
          ))}
        </div>
      </section>

      {signedUrl && (
        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Playback</h2>
          <video controls className="mt-3 w-full rounded-lg bg-black">
            <source src={signedUrl} />
          </video>
        </section>
      )}
    </main>
  );
}
