"use client";

import React, { useEffect, useMemo, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const HEADERS = { "x-workspace-id": "demo-workspace-id", "x-user-id": "demo-user" };
const STORAGE_KEY = "autoqual.studyWizard.v1";

type Study = {
  id: string;
  name: string;
  projectId: string;
  status: string;
  language: string;
  mode: string;
};

type WizardState = {
  workspaceId: string;
  projectId: string;
  studyId: string;
  name: string;
  objective: string;
  status: string;
  language: string;
  mode: string;
  markets: string;
  segments: string;
  brief: string;
  guideJson: string;
  screeningJson: string;
  quotasJson: string;
  recruitmentChecklistJson: string;
  localizationChecklistJson: string;
  activationChecklistJson: string;
  rolloutPlanJson: string;
  distributionTrackingJson: string;
};

const defaultState: WizardState = {
  workspaceId: "demo-workspace-id",
  projectId: "demo-project-id",
  studyId: "",
  name: "",
  objective: "",
  status: "draft",
  language: "en",
  mode: "voice",
  markets: "US, UK",
  segments: "",
  brief: "",
  guideJson: "",
  screeningJson: "{\"requiredFields\":[\"market\",\"role\"],\"screenOutRules\":[]}",
  quotasJson: "{\n  \"segment-a\": 10,\n  \"segment-b\": 10\n}",
  recruitmentChecklistJson: "{\n  \"screeningReady\": false,\n  \"incentivesApproved\": false\n}",
  localizationChecklistJson: "{\n  \"translationsComplete\": false,\n  \"qaDone\": false\n}",
  activationChecklistJson: "{\n  \"storyTemplateReady\": false,\n  \"stakeholderListReady\": false\n}",
  rolloutPlanJson: "{\n  \"markets\": [\"US\"],\n  \"status\": \"planned\"\n}",
  distributionTrackingJson: "{\n  \"channels\": [\"email\"],\n  \"measurement\": \"utm\"\n}",
};

const steps = [
  "Objective",
  "Segments & markets",
  "Guide builder",
  "Recruitment",
  "Run",
  "Analyze",
  "Activate",
];

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export default function StudiesWizardPage() {
  const [wizard, setWizard] = useState<WizardState>(defaultState);
  const [step, setStep] = useState(0);
  const [studies, setStudies] = useState<Study[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [guideStatus, setGuideStatus] = useState<string | null>(null);
  const [segmentSummary, setSegmentSummary] = useState<Record<string, number> | null>(null);
  const [quotaStatus, setQuotaStatus] = useState<
    Array<{ segment: string; target: number; actual: number; remaining: number }>
  >([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    try {
      setWizard({ ...defaultState, ...JSON.parse(stored) });
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wizard));
  }, [wizard]);

  const loadStudies = async () => {
    const res = await fetch(`${API_BASE}/studies?workspaceId=${wizard.workspaceId}`, {
      headers: HEADERS,
    });
    if (!res.ok) return;
    setStudies(await res.json());
  };

  useEffect(() => {
    loadStudies();
  }, [wizard.workspaceId]);

  const currentStepLabel = useMemo(() => steps[step] ?? "", [step]);

  const createStudy = async () => {
    if (!wizard.name.trim()) {
      setStatus("Study name is required.");
      return;
    }
    setStatus("Creating study...");
    const res = await fetch(`${API_BASE}/studies`, {
      method: "POST",
      headers: { ...HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({
        workspaceId: wizard.workspaceId,
        projectId: wizard.projectId,
        name: wizard.name.trim(),
        status: wizard.status,
        language: wizard.language,
        mode: wizard.mode,
        rolloutPlan: safeJsonParse(wizard.rolloutPlanJson) ?? undefined,
        distributionTracking: safeJsonParse(wizard.distributionTrackingJson) ?? undefined,
        recruitmentChecklist: safeJsonParse(wizard.recruitmentChecklistJson) ?? undefined,
        localizationChecklist: safeJsonParse(wizard.localizationChecklistJson) ?? undefined,
        activationChecklist: safeJsonParse(wizard.activationChecklistJson) ?? undefined,
      }),
    });
    if (!res.ok) {
      setStatus("Failed to create study.");
      return;
    }
    const created = (await res.json()) as Study;
    setWizard((prev) => ({ ...prev, studyId: created.id }));
    setStatus("Study created.");
    await loadStudies();
  };

  const buildGuide = async () => {
    if (!wizard.studyId) {
      setGuideStatus("Select a study first.");
      return;
    }
    setGuideStatus("Generating guide...");
    const res = await fetch(`${API_BASE}/studies/${wizard.studyId}/build`, {
      method: "POST",
      headers: { ...HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({ brief: wizard.brief }),
    });
    if (!res.ok) {
      setGuideStatus("Guide generation failed.");
      return;
    }
    const payload = await res.json();
    setWizard((prev) => ({
      ...prev,
      guideJson: JSON.stringify(payload.interviewGuide ?? payload, null, 2),
    }));
    setGuideStatus("Guide generated.");
  };

  const saveGuide = async () => {
    if (!wizard.studyId) {
      setGuideStatus("Select a study first.");
      return;
    }
    const guide = safeJsonParse(wizard.guideJson);
    if (!guide) {
      setGuideStatus("Guide JSON is invalid.");
      return;
    }
    setGuideStatus("Saving guide...");
    const res = await fetch(`${API_BASE}/studies/${wizard.studyId}/guide`, {
      method: "POST",
      headers: { ...HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({ guide }),
    });
    setGuideStatus(res.ok ? "Guide saved with new version." : "Failed to save guide.");
  };

  const saveRecruitment = async () => {
    if (!wizard.studyId) {
      setStatus("Select a study first.");
      return;
    }
    const quotas = safeJsonParse(wizard.quotasJson);
    const screening = safeJsonParse(wizard.screeningJson);
    const recruitmentChecklist = safeJsonParse(wizard.recruitmentChecklistJson);
    const localizationChecklist = safeJsonParse(wizard.localizationChecklistJson);
    if (!quotas || !screening || !recruitmentChecklist || !localizationChecklist) {
      setStatus("Recruitment JSON payloads must be valid.");
      return;
    }
    setStatus("Saving recruitment settings...");
    await Promise.all([
      fetch(`${API_BASE}/studies/${wizard.studyId}/quotas`, {
        method: "POST",
        headers: { ...HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify({ quotaTargets: quotas }),
      }),
      fetch(`${API_BASE}/studies/${wizard.studyId}/recruitment`, {
        method: "POST",
        headers: { ...HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify({ checklist: recruitmentChecklist }),
      }),
      fetch(`${API_BASE}/studies/${wizard.studyId}/localization`, {
        method: "POST",
        headers: { ...HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify({ checklist: localizationChecklist }),
      }),
      fetch(`${API_BASE}/studies/${wizard.studyId}/build`, {
        method: "POST",
        headers: { ...HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify({ brief: wizard.brief }),
      }),
    ]);
    setStatus("Recruitment settings saved.");
  };

  const saveActivation = async () => {
    if (!wizard.studyId) {
      setStatus("Select a study first.");
      return;
    }
    const activationChecklist = safeJsonParse(wizard.activationChecklistJson);
    const rolloutPlan = safeJsonParse(wizard.rolloutPlanJson);
    const distributionTracking = safeJsonParse(wizard.distributionTrackingJson);
    if (!activationChecklist || !rolloutPlan || !distributionTracking) {
      setStatus("Activation JSON payloads must be valid.");
      return;
    }
    setStatus("Saving activation settings...");
    await Promise.all([
      fetch(`${API_BASE}/studies/${wizard.studyId}/activation`, {
        method: "POST",
        headers: { ...HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify({ checklist: activationChecklist }),
      }),
      fetch(`${API_BASE}/studies/${wizard.studyId}/rollout`, {
        method: "POST",
        headers: { ...HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify({ rolloutPlan }),
      }),
      fetch(`${API_BASE}/studies/${wizard.studyId}/distribution`, {
        method: "POST",
        headers: { ...HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify({ distributionTracking }),
      }),
    ]);
    setStatus("Activation settings saved.");
  };

  const refreshRunMetrics = async () => {
    if (!wizard.studyId) return;
    const [segmentsRes, quotaRes] = await Promise.all([
      fetch(`${API_BASE}/studies/${wizard.studyId}/segment-summary`, { headers: HEADERS }),
      fetch(`${API_BASE}/studies/${wizard.studyId}/quota-status`, { headers: HEADERS }),
    ]);
    if (segmentsRes.ok) {
      const payload = await segmentsRes.json();
      setSegmentSummary(payload.segments ?? null);
    }
    if (quotaRes.ok) {
      const payload = await quotaRes.json();
      setQuotaStatus(payload.status ?? []);
    }
  };

  return (
    <main className="min-h-screen px-8 py-10">
      <h1 className="text-2xl font-semibold">Study wizard</h1>
      <p className="mt-2 text-sm text-gray-600">
        Step-by-step setup for briefs, recruitment, moderation, and activation.
      </p>

      <section className="mt-6 flex flex-wrap items-center gap-2 text-xs text-gray-500">
        {steps.map((label, index) => (
          <button
            key={label}
            type="button"
            onClick={() => setStep(index)}
            className={`rounded-full border px-3 py-1 ${
              step === index ? "border-brand-500 text-brand-600" : "border-gray-200"
            }`}
          >
            {index + 1}. {label}
          </button>
        ))}
      </section>

      <section className="mt-6 max-w-3xl rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{currentStepLabel}</h2>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Study ID</span>
            <select
              className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
              value={wizard.studyId}
              onChange={(event) => setWizard((prev) => ({ ...prev, studyId: event.target.value }))}
            >
              <option value="">Select study</option>
              {studies.map((study) => (
                <option key={study.id} value={study.id}>
                  {study.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {step === 0 && (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="text-sm text-gray-600">
              Workspace ID
              <input
                className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-sm"
                value={wizard.workspaceId}
                onChange={(event) => setWizard((prev) => ({ ...prev, workspaceId: event.target.value }))}
              />
            </label>
            <label className="text-sm text-gray-600">
              Project ID
              <input
                className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-sm"
                value={wizard.projectId}
                onChange={(event) => setWizard((prev) => ({ ...prev, projectId: event.target.value }))}
              />
            </label>
            <label className="text-sm text-gray-600 md:col-span-2">
              Study name
              <input
                className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-sm"
                value={wizard.name}
                onChange={(event) => setWizard((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="e.g. Checkout experience exploration"
              />
            </label>
            <label className="text-sm text-gray-600 md:col-span-2">
              Objective
              <textarea
                className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-sm"
                rows={3}
                value={wizard.objective}
                onChange={(event) => setWizard((prev) => ({ ...prev, objective: event.target.value }))}
                placeholder="What decision should this study inform?"
              />
            </label>
            <label className="text-sm text-gray-600">
              Status
              <select
                className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-sm"
                value={wizard.status}
                onChange={(event) => setWizard((prev) => ({ ...prev, status: event.target.value }))}
              >
                <option value="draft">Draft</option>
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
              </select>
            </label>
            <label className="text-sm text-gray-600">
              Language
              <select
                className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-sm"
                value={wizard.language}
                onChange={(event) => setWizard((prev) => ({ ...prev, language: event.target.value }))}
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
              </select>
            </label>
            <label className="text-sm text-gray-600">
              Mode
              <select
                className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-sm"
                value={wizard.mode}
                onChange={(event) => setWizard((prev) => ({ ...prev, mode: event.target.value }))}
              >
                <option value="voice">Voice</option>
                <option value="text">Text</option>
              </select>
            </label>
            <div className="md:col-span-2">
              <button
                type="button"
                onClick={createStudy}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white"
              >
                Create study
              </button>
              {status && <p className="mt-2 text-xs text-gray-500">{status}</p>}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="mt-4 grid gap-3">
            <label className="text-sm text-gray-600">
              Target segments (comma separated)
              <input
                className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-sm"
                value={wizard.segments}
                onChange={(event) => setWizard((prev) => ({ ...prev, segments: event.target.value }))}
                placeholder="e.g. power users, switchers, churned"
              />
            </label>
            <label className="text-sm text-gray-600">
              Markets
              <input
                className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-sm"
                value={wizard.markets}
                onChange={(event) => setWizard((prev) => ({ ...prev, markets: event.target.value }))}
              />
            </label>
            <p className="text-xs text-gray-500">
              Use the recruitment step to translate segments and markets into screening logic and quotas.
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="mt-4 grid gap-3">
            <label className="text-sm text-gray-600">
              Brief
              <textarea
                className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-sm"
                rows={4}
                value={wizard.brief}
                onChange={(event) => setWizard((prev) => ({ ...prev, brief: event.target.value }))}
                placeholder="Paste the study brief here to generate the guide."
              />
            </label>
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={buildGuide}
                className="rounded-full border border-brand-500 px-3 py-1 font-medium text-brand-600"
              >
                Generate guide
              </button>
              <button
                type="button"
                onClick={saveGuide}
                className="rounded-full border border-gray-200 px-3 py-1 text-gray-600"
              >
                Save new version
              </button>
              {guideStatus && <span className="text-xs text-gray-500">{guideStatus}</span>}
            </div>
            <label className="text-sm text-gray-600">
              Interview guide (JSON)
              <textarea
                className="mt-1 w-full rounded-lg border border-gray-200 p-2 font-mono text-xs"
                rows={10}
                value={wizard.guideJson}
                onChange={(event) => setWizard((prev) => ({ ...prev, guideJson: event.target.value }))}
                placeholder="Guide JSON will appear here."
              />
            </label>
          </div>
        )}

        {step === 3 && (
          <div className="mt-4 grid gap-3">
            <label className="text-sm text-gray-600">
              Screening logic (JSON)
              <textarea
                className="mt-1 w-full rounded-lg border border-gray-200 p-2 font-mono text-xs"
                rows={6}
                value={wizard.screeningJson}
                onChange={(event) => setWizard((prev) => ({ ...prev, screeningJson: event.target.value }))}
              />
            </label>
            <label className="text-sm text-gray-600">
              Quota targets (JSON)
              <textarea
                className="mt-1 w-full rounded-lg border border-gray-200 p-2 font-mono text-xs"
                rows={5}
                value={wizard.quotasJson}
                onChange={(event) => setWizard((prev) => ({ ...prev, quotasJson: event.target.value }))}
              />
            </label>
            <label className="text-sm text-gray-600">
              Recruitment checklist (JSON)
              <textarea
                className="mt-1 w-full rounded-lg border border-gray-200 p-2 font-mono text-xs"
                rows={4}
                value={wizard.recruitmentChecklistJson}
                onChange={(event) =>
                  setWizard((prev) => ({ ...prev, recruitmentChecklistJson: event.target.value }))
                }
              />
            </label>
            <label className="text-sm text-gray-600">
              Localization checklist (JSON)
              <textarea
                className="mt-1 w-full rounded-lg border border-gray-200 p-2 font-mono text-xs"
                rows={4}
                value={wizard.localizationChecklistJson}
                onChange={(event) =>
                  setWizard((prev) => ({ ...prev, localizationChecklistJson: event.target.value }))
                }
              />
            </label>
            <button
              type="button"
              onClick={saveRecruitment}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white"
            >
              Save recruitment setup
            </button>
            {status && <p className="text-xs text-gray-500">{status}</p>}
          </div>
        )}

        {step === 4 && (
          <div className="mt-4 grid gap-4">
            <div className="rounded-xl border border-gray-100 p-4">
              <div className="text-xs uppercase text-gray-500">Session monitoring</div>
              <p className="mt-2 text-xs text-gray-500">
                Track quotas and participant distribution while interviews are running.
              </p>
              <button
                type="button"
                onClick={refreshRunMetrics}
                className="mt-3 rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600"
              >
                Refresh metrics
              </button>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-gray-100 p-3 text-xs text-gray-500">
                  <div className="text-xs uppercase text-gray-400">Segments</div>
                  {segmentSummary ? (
                    Object.entries(segmentSummary).map(([segment, count]) => (
                      <div key={segment} className="mt-1">
                        {segment}: {count}
                      </div>
                    ))
                  ) : (
                    <p className="mt-2">No segment data yet.</p>
                  )}
                </div>
                <div className="rounded-lg border border-gray-100 p-3 text-xs text-gray-500">
                  <div className="text-xs uppercase text-gray-400">Quota status</div>
                  {quotaStatus.length ? (
                    quotaStatus.map((quota) => (
                      <div key={quota.segment} className="mt-1">
                        {quota.segment}: {quota.actual}/{quota.target} (remaining {quota.remaining})
                      </div>
                    ))
                  ) : (
                    <p className="mt-2">No quota status yet.</p>
                  )}
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-gray-100 p-4 text-xs text-gray-500">
              Next: use the Interview page to monitor active sessions and verify consent.
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="mt-4 grid gap-4">
            <div className="rounded-xl border border-gray-100 p-4">
              <div className="text-xs uppercase text-gray-500">Analysis checklist</div>
              <ul className="mt-2 space-y-1 text-xs text-gray-500">
                <li>Generate themes from insights.</li>
                <li>Review evidence coverage for each insight.</li>
                <li>Queue insights for review.</li>
              </ul>
            </div>
            <div className="rounded-xl border border-gray-100 p-4 text-xs text-gray-500">
              Use `POST /themes/generate` and `/search/insights/query-evidence` to kick off analysis.
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="mt-4 grid gap-3">
            <label className="text-sm text-gray-600">
              Activation checklist (JSON)
              <textarea
                className="mt-1 w-full rounded-lg border border-gray-200 p-2 font-mono text-xs"
                rows={4}
                value={wizard.activationChecklistJson}
                onChange={(event) =>
                  setWizard((prev) => ({ ...prev, activationChecklistJson: event.target.value }))
                }
              />
            </label>
            <label className="text-sm text-gray-600">
              Rollout plan (JSON)
              <textarea
                className="mt-1 w-full rounded-lg border border-gray-200 p-2 font-mono text-xs"
                rows={4}
                value={wizard.rolloutPlanJson}
                onChange={(event) => setWizard((prev) => ({ ...prev, rolloutPlanJson: event.target.value }))}
              />
            </label>
            <label className="text-sm text-gray-600">
              Distribution tracking (JSON)
              <textarea
                className="mt-1 w-full rounded-lg border border-gray-200 p-2 font-mono text-xs"
                rows={4}
                value={wizard.distributionTrackingJson}
                onChange={(event) =>
                  setWizard((prev) => ({ ...prev, distributionTrackingJson: event.target.value }))
                }
              />
            </label>
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={saveActivation}
                className="rounded-full border border-brand-500 px-3 py-1 font-medium text-brand-600"
              >
                Save activation setup
              </button>
              <a className="rounded-full border border-gray-200 px-3 py-1 text-gray-600" href="/stories">
                Open story builder
              </a>
              <a className="rounded-full border border-gray-200 px-3 py-1 text-gray-600" href="/stakeholder">
                Open stakeholder portal
              </a>
            </div>
            {status && <p className="text-xs text-gray-500">{status}</p>}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => setStep((prev) => Math.max(prev - 1, 0))}
            className="rounded-full border border-gray-200 px-3 py-1 text-gray-600"
          >
            Previous
          </button>
          <div className="text-gray-400">Step {step + 1} of {steps.length}</div>
          <button
            type="button"
            onClick={() => setStep((prev) => Math.min(prev + 1, steps.length - 1))}
            className="rounded-full border border-gray-200 px-3 py-1 text-gray-600"
          >
            Next
          </button>
        </div>
      </section>
    </main>
  );
}
