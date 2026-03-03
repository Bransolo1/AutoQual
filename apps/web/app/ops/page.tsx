"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useApi } from "../lib/use-api";

type Dashboard = {
  workloadByAssignee: { assignee: string; count: number }[];
  overdueTasks: number;
  overdueTaskIds: string[];
  overdueTaskDetails: { id: string; title: string; assigneeUserId?: string | null; dueDate: string; projectId: string }[];
  blockedTasks: { id: string; title: string; projectId: string; blockedReason?: string | null; blockedByTaskId?: string | null }[];
  deliveryRiskProjects: { id: string; name: string; targetDeliveryDate: string }[];
  cycleTimeDays: number | null;
  throughputInterviewsThisWeek: number;
  throughputReportsThisWeek: number;
  recruitmentVerification?: {
    pending: number;
    verified: number;
    flagged: number;
    rejected: number;
  };
  stakeholderFeedback?: {
    total: number;
    avgRating: number | null;
    sentiment: { positive: number; neutral: number; negative: number; unspecified: number };
    byDeliverableType?: Record<string, { total: number; avgRating: number | null }>;
    trendWeekly?: { week: string; count: number; avgRating: number | null }[];
  };
  activationMetrics?: {
    totalViews: number;
    totalShares: number;
    totalDecisionsLogged: number;
  };
  activationByDeliverableType?: Record<string, { totalViews: number; totalShares: number; totalDecisionsLogged: number }>;
  activationTrendWeekly?: {
    week: string;
    deliverableType: string;
    totalViews: number;
    totalShares: number;
    totalDecisionsLogged: number;
  }[];
};

type SecurityAlert = {
  id: string;
  action: string;
  actorUserId: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  metadata: Record<string, unknown>;
  severity: "info" | "warning" | "critical";
  summary: string;
};

export default function OpsDashboardPage() {
  const { apiFetch, user } = useApi();
  const [data, setData] = useState<Dashboard | null>(null);
  const [blockedFilter, setBlockedFilter] = useState("");
  const [retentionStatus, setRetentionStatus] = useState<string | null>(null);
  const [lastRetention, setLastRetention] = useState<string | null>(null);
  const [metricProjectId, setMetricProjectId] = useState("");
  const [metricStudyId, setMetricStudyId] = useState("");
  const [metricDeliverableType, setMetricDeliverableType] = useState("deliverable_pack");
  const [metricDeliverableId, setMetricDeliverableId] = useState("");
  const [metricViews, setMetricViews] = useState(0);
  const [metricShares, setMetricShares] = useState(0);
  const [metricDecisions, setMetricDecisions] = useState(0);
  const [metricStatus, setMetricStatus] = useState<string | null>(null);
  const [bulkPayload, setBulkPayload] = useState("");
  const [bulkStatus, setBulkStatus] = useState<string | null>(null);
  const [activationFilter, setActivationFilter] = useState("all");
  const [alertSummary, setAlertSummary] = useState<{ lowActivation: number; lowFeedback: number } | null>(null);
  const [ssoConfig, setSsoConfig] = useState<{ enabled: boolean; issuerUrl: string; clientId: string } | null>(null);
  const [secretsHealth, setSecretsHealth] = useState<{ provider: string; status: string; message: string } | null>(null);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [alertsRefreshStatus, setAlertsRefreshStatus] = useState<string | null>(null);

  useEffect(() => {
    apiFetch(`/ops/dashboard?workspaceId=${user?.workspaceId ?? ""}`))
      .then((r) => (r.ok ? r.json() : null))
      .then((payload) => {
        setData(payload);
        if (payload?.activationMetrics && payload?.stakeholderFeedback) {
          const lowActivation = payload.activationMetrics.totalViews < 10 ? 1 : 0;
          const lowFeedback = payload.stakeholderFeedback.avgRating !== null &&
            payload.stakeholderFeedback.avgRating < 3 ? 1 : 0;
          setAlertSummary({ lowActivation, lowFeedback });
        }
      });
    apiFetch(`/audit?workspaceId=${user?.workspaceId ?? ""}&entityType=workspace&limit=5`))
      .then((r) => (r.ok ? r.json() : []))
      .then((events: { action: string; createdAt: string }[]) => {
        const retention = events.find((event) => event.action.startsWith("retention."));
        if (retention) {
          setLastRetention(new Date(retention.createdAt).toLocaleString());
        }
      });
    apiFetch(`/auth/sso/config`))
      .then((r) => (r.ok ? r.json() : null))
      .then(setSsoConfig);
    apiFetch(`/secrets/health`))
      .then((r) => (r.ok ? r.json() : null))
      .then(setSecretsHealth);
    apiFetch(`/ops/security-alerts?workspaceId=${user?.workspaceId ?? ""}&limit=8`))
      .then((r) => (r.ok ? r.json() : []))
      .then(setSecurityAlerts);
  }, []);

  if (!data) return <main className="p-8">Loading…</main>;

  const filteredBlocked = data.blockedTasks.filter((task) => {
    if (!blockedFilter.trim()) return true;
    return (task.blockedReason ?? "").toLowerCase().includes(blockedFilter.trim().toLowerCase());
  });

  return (
    <main className="min-h-screen px-8 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Operations Dashboard</h1>
        <Link href="/projects" className="text-brand-600 hover:underline">Back to Projects</Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500">Workload by assignee</h2>
          <ul className="mt-3 space-y-2">
            {data.workloadByAssignee.map(({ assignee, count }) => (
              <li key={assignee} className="flex justify-between text-sm">
                <span>{assignee}</span>
                <span className="font-medium">{count}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500">Overdue tasks</h2>
          <p className="mt-2 text-3xl font-semibold">{data.overdueTasks}</p>
          <button
            type="button"
            onClick={async () => {
              await apiFetch(`/ops/overdue-reminders?workspaceId=${user?.workspaceId ?? ""}`,{method: "POST"});
            }}
            className="mt-3 rounded-full border border-brand-500 px-3 py-1 text-xs font-medium text-brand-600"
          >
            Send reminders
          </button>
          <Link href="/ops/overdue" className="mt-3 inline-block text-xs text-brand-600 hover:underline">
            View all overdue →
          </Link>
          <ul className="mt-3 space-y-2 text-xs text-gray-500">
            {data.overdueTaskDetails.slice(0, 5).map((task) => (
              <li key={task.id} className="flex flex-col gap-1">
                <Link href={`/projects/${task.projectId}`} className="text-brand-600 hover:underline">
                  {task.title}
                </Link>
                <span>
                  Due {new Date(task.dueDate).toLocaleDateString()} ·{" "}
                  {task.assigneeUserId ? `Assignee ${task.assigneeUserId}` : "Unassigned"}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500">Blocked tasks</h2>
          <p className="mt-2 text-3xl font-semibold">{filteredBlocked.length}</p>
          <input
            value={blockedFilter}
            onChange={(event) => setBlockedFilter(event.target.value)}
            placeholder="Filter by blocker reason"
            className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <Link href="/ops/blocked" className="mt-3 inline-block text-xs text-brand-600 hover:underline">
            View all blocked →
          </Link>
          <a
            href={`/ops/blocked.csv?workspaceId=${user?.workspaceId ?? ""}&q=${encodeURIComponent(
              blockedFilter,
            )}`}
            className="mt-3 inline-block text-xs text-brand-600 hover:underline"
          >
            Export blocked CSV →
          </a>
          <ul className="mt-2 space-y-1 text-sm">
            {filteredBlocked.slice(0, 5).map((task) => (
              <li key={task.id}>
                <Link href={`/projects/${task.projectId}`} className="text-brand-600 hover:underline">
                  {task.title}
                </Link>
                {task.blockedReason && (
                  <span className="ml-2 text-xs text-gray-500">· {task.blockedReason}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500">Delivery risk</h2>
          <p className="mt-2 text-3xl font-semibold">{data.deliveryRiskProjects.length}</p>
          <ul className="mt-2 space-y-1 text-sm">
            {data.deliveryRiskProjects.map((p) => (
              <li key={p.id}>
                <Link href={`/projects/${p.id}`} className="text-brand-600 hover:underline">{p.name}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-500">Security alerts</h2>
            <div className="flex items-center gap-3 text-xs">
              <button
                type="button"
                onClick={async () => {
                  setAlertsRefreshStatus("Scanning...");
                  const res = await apiFetch(`/ops/alerts/refresh?workspaceId=${user?.workspaceId ?? ""}`,{method: "POST"});
                  setAlertsRefreshStatus(res.ok ? "Alerts refreshed." : "Alert refresh failed.");
                  const updated = res.ok ? await apiFetch(`/ops/security-alerts?workspaceId=${user?.workspaceId ?? ""}&limit=8`)) : null;
                  if (updated?.ok) {
                    setSecurityAlerts(await updated.json());
                  }
                }}
                className="rounded-full border border-brand-500 px-3 py-1 text-[11px] font-medium text-brand-600"
              >
                Run alert scan
              </button>
              <Link href="/audit" className="text-brand-600 hover:underline">View audit log</Link>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Latest security-sensitive events across the workspace.
          </p>
          {alertsRefreshStatus && <p className="mt-2 text-[11px] text-gray-500">{alertsRefreshStatus}</p>}
          <ul className="mt-3 space-y-2 text-sm">
            {securityAlerts.map((alert) => (
              <li key={alert.id} className="rounded-lg border border-gray-100 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs uppercase text-gray-500">{alert.summary}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      alert.severity === "critical"
                        ? "bg-rose-100 text-rose-700"
                        : alert.severity === "warning"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {alert.severity}
                  </span>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {new Date(alert.createdAt).toLocaleString()} · {alert.action} · Actor {alert.actorUserId}
                </div>
              </li>
            ))}
            {securityAlerts.length === 0 && (
              <li className="text-xs text-gray-500">No recent security alerts.</li>
            )}
          </ul>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500">Throughput (this week)</h2>
          <p className="mt-2 text-sm">Interviews: {data.throughputInterviewsThisWeek}</p>
          <p className="mt-1 text-sm">Reports: {data.throughputReportsThisWeek}</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500">Recruitment verification</h2>
          <p className="mt-2 text-xs text-gray-600">Participant verification and fraud screening status.</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg border border-gray-100 p-2">
              <div className="text-[11px] uppercase text-gray-500">Pending</div>
              <div className="mt-1 text-lg font-semibold">
                {data.recruitmentVerification?.pending ?? 0}
              </div>
            </div>
            <div className="rounded-lg border border-gray-100 p-2">
              <div className="text-[11px] uppercase text-gray-500">Verified</div>
              <div className="mt-1 text-lg font-semibold">
                {data.recruitmentVerification?.verified ?? 0}
              </div>
            </div>
            <div className="rounded-lg border border-gray-100 p-2">
              <div className="text-[11px] uppercase text-gray-500">Flagged</div>
              <div className="mt-1 text-lg font-semibold">
                {data.recruitmentVerification?.flagged ?? 0}
              </div>
            </div>
            <div className="rounded-lg border border-gray-100 p-2">
              <div className="text-[11px] uppercase text-gray-500">Rejected</div>
              <div className="mt-1 text-lg font-semibold">
                {data.recruitmentVerification?.rejected ?? 0}
              </div>
            </div>
          </div>
          <Link href="/ops/recruitment" className="mt-3 inline-block text-xs text-brand-600 hover:underline">
            Review recruitment queue →
          </Link>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500">Security posture</h2>
          <div className="mt-3 space-y-2 text-xs text-gray-600">
            <div className="flex items-center justify-between">
              <span>SSO</span>
              <span className="text-xs text-gray-500">
                {ssoConfig?.enabled ? "Enabled" : "Disabled"}
              </span>
            </div>
            {ssoConfig?.issuerUrl && (
              <div className="text-[11px] text-gray-500">Issuer: {ssoConfig.issuerUrl}</div>
            )}
            <div className="flex items-center justify-between">
              <span>Secrets provider</span>
              <span className="text-xs text-gray-500">{secretsHealth?.provider ?? "n/a"}</span>
            </div>
            <div className="text-[11px] text-gray-500">
              {secretsHealth?.status ?? "unknown"} · {secretsHealth?.message ?? "No status"}
            </div>
            {lastRetention && (
              <div className="text-[11px] text-gray-500">Last retention: {lastRetention}</div>
            )}
            <a href="/audit" className="text-xs text-brand-600 hover:underline">
              View audit controls →
            </a>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500">Stakeholder feedback</h2>
          <p className="mt-2 text-xs text-gray-600">Sentiment and ratings from deliverable reviews.</p>
          <div className="mt-3 text-sm text-gray-700">
            Total responses: {data.stakeholderFeedback?.total ?? 0}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Avg rating: {data.stakeholderFeedback?.avgRating ?? "n/a"}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div className="rounded-lg border border-gray-100 p-2">
              Positive: {data.stakeholderFeedback?.sentiment.positive ?? 0}
            </div>
            <div className="rounded-lg border border-gray-100 p-2">
              Neutral: {data.stakeholderFeedback?.sentiment.neutral ?? 0}
            </div>
            <div className="rounded-lg border border-gray-100 p-2">
              Negative: {data.stakeholderFeedback?.sentiment.negative ?? 0}
            </div>
            <div className="rounded-lg border border-gray-100 p-2">
              Unspecified: {data.stakeholderFeedback?.sentiment.unspecified ?? 0}
            </div>
          </div>
          {data.stakeholderFeedback?.byDeliverableType && (
            <div className="mt-3 text-xs text-gray-600">
              {Object.entries(data.stakeholderFeedback.byDeliverableType).map(([key, value]) => (
                <div key={key} className="mt-1">
                  {key}: {value.total} responses · Avg {value.avgRating ?? "n/a"}
                </div>
              ))}
            </div>
          )}
          {data.stakeholderFeedback?.trendWeekly && data.stakeholderFeedback.trendWeekly.length > 0 && (
            <div className="mt-3 text-xs text-gray-600">
              <div className="text-[11px] uppercase text-gray-500">Weekly trend</div>
              {data.stakeholderFeedback.trendWeekly.map((row) => (
                <div key={row.week} className="mt-1">
                  Week {row.week}: {row.count} responses · Avg {row.avgRating ?? "n/a"}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500">Activation KPIs</h2>
          <p className="mt-2 text-xs text-gray-600">Engagement signals for activated deliverables.</p>
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
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-gray-600">
            <div className="rounded-lg border border-gray-100 p-2">
              Views: {data.activationMetrics?.totalViews ?? 0}
            </div>
            <div className="rounded-lg border border-gray-100 p-2">
              Shares: {data.activationMetrics?.totalShares ?? 0}
            </div>
            <div className="rounded-lg border border-gray-100 p-2">
              Decisions: {data.activationMetrics?.totalDecisionsLogged ?? 0}
            </div>
          </div>
          {data.activationTrendWeekly && data.activationTrendWeekly.length > 0 && (
            <div className="mt-3 text-xs text-gray-600">
              <div className="text-[11px] uppercase text-gray-500">Weekly trend</div>
              {data.activationTrendWeekly
                .filter((row) => activationFilter === "all" || row.deliverableType === activationFilter)
                .map((row, index) => (
                <div key={`${row.week}-${row.deliverableType}-${index}`} className="mt-1">
                  Week {row.week} · {row.deliverableType}: {row.totalViews} views ·{" "}
                  {row.totalShares} shares · {row.totalDecisionsLogged} decisions
                </div>
              ))}
            </div>
          )}
          {data.activationByDeliverableType && (
            <div className="mt-3 text-xs text-gray-600">
              {Object.entries(data.activationByDeliverableType).map(([key, value]) => (
                <div key={key} className="mt-1">
                  {key}: {value.totalViews} views · {value.totalShares} shares ·{" "}
                  {value.totalDecisionsLogged} decisions
                </div>
              ))}
            </div>
          )}
          <p className="mt-2 text-[11px] text-gray-500">
            Track trends in the activation metrics workspace.
          </p>
        </div>
        {alertSummary && (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-500">Alert summary</h2>
            <p className="mt-2 text-xs text-gray-600">Workspace-level adoption signals.</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
              <div className="rounded-lg border border-gray-100 p-2">
                Low activation alerts: {alertSummary.lowActivation}
              </div>
              <div className="rounded-lg border border-gray-100 p-2">
                Low feedback alerts: {alertSummary.lowFeedback}
              </div>
            </div>
            <Link href="/ops/alerts" className="mt-3 inline-block text-xs text-brand-600 hover:underline">
              View alert history →
            </Link>
          </div>
        )}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500">Log activation metrics</h2>
          <p className="mt-2 text-xs text-gray-600">Manual entry for deliverable KPIs.</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <input
              value={metricProjectId}
              onChange={(event) => setMetricProjectId(event.target.value)}
              placeholder="Project ID"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <input
              value={metricStudyId}
              onChange={(event) => setMetricStudyId(event.target.value)}
              placeholder="Study ID (optional)"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <select
              value={metricDeliverableType}
              onChange={(event) => setMetricDeliverableType(event.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="deliverable_pack">Deliverable pack</option>
              <option value="report">Report</option>
              <option value="story">Story</option>
            </select>
            <input
              value={metricDeliverableId}
              onChange={(event) => setMetricDeliverableId(event.target.value)}
              placeholder="Deliverable ID (optional)"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <input
              type="number"
              min={0}
              value={metricViews}
              onChange={(event) => setMetricViews(Number(event.target.value))}
              placeholder="Views"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <input
              type="number"
              min={0}
              value={metricShares}
              onChange={(event) => setMetricShares(Number(event.target.value))}
              placeholder="Shares"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <input
              type="number"
              min={0}
              value={metricDecisions}
              onChange={(event) => setMetricDecisions(Number(event.target.value))}
              placeholder="Decisions logged"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={async () => {
              if (!metricProjectId.trim()) {
                setMetricStatus("Project ID is required.");
                return;
              }
              setMetricStatus("Submitting...");
              const res = await apiFetch(`/activation-metrics`,{method: "POST",
                headers: { ...HEADERS, "Content-Type": "application/json" },
                body: JSON.stringify({
                  workspaceId: user?.workspaceId ?? "",
                  projectId: metricProjectId.trim(),
                  studyId: metricStudyId.trim() || undefined,
                  deliverableType: metricDeliverableType,
                  deliverableId: metricDeliverableId.trim() || undefined,
                  views: metricViews,
                  shares: metricShares,
                  decisionsLogged: metricDecisions,
                }),
              });
              setMetricStatus(res.ok ? "Activation metrics logged." : "Failed to log metrics.");
            }}
            className="mt-3 rounded-full border border-brand-500 px-4 py-2 text-sm font-medium text-brand-600"
          >
            Log metrics
          </button>
          {metricStatus && <p className="mt-2 text-xs text-gray-500">{metricStatus}</p>}
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500">Bulk activation metrics</h2>
          <p className="mt-2 text-xs text-gray-600">
            Paste JSON lines payloads for bulk KPI logging.
          </p>
          <textarea
            value={bulkPayload}
            onChange={(event) => setBulkPayload(event.target.value)}
            className="mt-3 w-full rounded-lg border border-gray-200 p-3 text-xs"
            rows={6}
            placeholder='{"workspaceId":user?.workspaceId ?? "","projectId":"proj","deliverableType":"report","views":10,"shares":2,"decisionsLogged":1}'
          />
          <button
            type="button"
            onClick={async () => {
              const lines = bulkPayload.split("\n").map((line) => line.trim()).filter(Boolean);
              if (!lines.length) {
                setBulkStatus("Paste at least one JSON line.");
                return;
              }
              setBulkStatus("Submitting...");
              for (const line of lines) {
                try {
                  const payload = JSON.parse(line);
                  await apiFetch(`/activation-metrics`, {
                    method: "POST",
                    headers: { ...HEADERS, "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                  });
                } catch (error) {
                  setBulkStatus("Invalid JSON payload detected.");
                  return;
                }
              }
              setBulkStatus("Bulk metrics logged.");
              setBulkPayload("");
            }}
            className="mt-3 rounded-full border border-brand-500 px-4 py-2 text-sm font-medium text-brand-600"
          >
            Submit bulk metrics
          </button>
          {bulkStatus && <p className="mt-2 text-xs text-gray-500">{bulkStatus}</p>}
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500">Retention jobs</h2>
          <p className="mt-2 text-sm text-gray-600">Archive stale media based on workspace settings.</p>
          <button
            type="button"
            onClick={async () => {
              setRetentionStatus("Queuing...");
              const res = await apiFetch(`/ops/retention-run?workspaceId=${user?.workspaceId ?? ""}`, {
                method: "POST"});
              setRetentionStatus(res.ok ? "Retention job queued." : "Failed to queue job.");
            }}
            className="mt-3 rounded-full border border-brand-500 px-3 py-1 text-xs font-medium text-brand-600"
          >
            Run retention job
          </button>
          {lastRetention && (
            <p className="mt-2 text-xs text-gray-500">Last queued: {lastRetention}</p>
          )}
          {retentionStatus && <p className="mt-2 text-xs text-gray-500">{retentionStatus}</p>}
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500">Avg cycle time</h2>
          <p className="mt-2 text-3xl font-semibold">
            {data.cycleTimeDays === null ? "n/a" : `${Math.round(data.cycleTimeDays)} days`}
          </p>
          <p className="mt-1 text-xs text-gray-500">Based on completed projects.</p>
        </div>
      </div>
    </main>
  );
}
