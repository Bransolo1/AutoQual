"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useApi } from "../lib/use-api";

const STORAGE_KEY = "autoqual.studyWizard.v2";

// ─── Types ───────────────────────────────────────────────────────────────────

type Study = {
  id: string;
  name: string;
  projectId: string;
  status: string;
  language: string;
  mode: string;
};

type Project = { id: string; name: string };

type GuideQuestion = { id: string; text: string; probe: string };
type GuideSection = { id: string; title: string; questions: GuideQuestion[] };
type StopConditions = { maxTurns: number; minCoverage: number };
type ModeratorConfig = {
  systemPrompt: string;
  depthTemperature: number;
  modality: "voice" | "text" | "participant-choice";
  sufficiencyThreshold: number;
  maxProbesPerQuestion: number;
};

type WizardState = {
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
  // Structured guide (replaces guideJson textarea)
  guideSections: GuideSection[];
  guideStopConditions: StopConditions;
  guideModeratorConfig: ModeratorConfig;
  // Recruitment (still JSON for now)
  screeningJson: string;
  quotasJson: string;
  recruitmentChecklistJson: string;
  localizationChecklistJson: string;
  // Activation (still JSON)
  activationChecklistJson: string;
  rolloutPlanJson: string;
  distributionTrackingJson: string;
};

const DEFAULT_MOD_CONFIG: ModeratorConfig = {
  systemPrompt: "",
  depthTemperature: 5,
  modality: "voice",
  sufficiencyThreshold: 0.7,
  maxProbesPerQuestion: 2,
};

const DEFAULT_STOP: StopConditions = { maxTurns: 30, minCoverage: 0.7 };

const defaultState: WizardState = {
  projectId: "",
  studyId: "",
  name: "",
  objective: "",
  status: "draft",
  language: "en",
  mode: "voice",
  markets: "US, UK",
  segments: "",
  brief: "",
  guideSections: [],
  guideStopConditions: DEFAULT_STOP,
  guideModeratorConfig: DEFAULT_MOD_CONFIG,
  screeningJson: '{"requiredFields":["market","role"],"screenOutRules":[]}',
  quotasJson: '{\n  "segment-a": 10,\n  "segment-b": 10\n}',
  recruitmentChecklistJson: '{\n  "screeningReady": false,\n  "incentivesApproved": false\n}',
  localizationChecklistJson: '{\n  "translationsComplete": false,\n  "qaDone": false\n}',
  activationChecklistJson: '{\n  "storyTemplateReady": false,\n  "stakeholderListReady": false\n}',
  rolloutPlanJson: '{\n  "markets": ["US"],\n  "status": "planned"\n}',
  distributionTrackingJson: '{\n  "channels": ["email"],\n  "measurement": "utm"\n}',
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function safeJsonParse(value: string) {
  try { return JSON.parse(value); } catch { return null; }
}

function buildGuideJson(
  sections: GuideSection[],
  stopConditions: StopConditions,
  moderatorConfig: ModeratorConfig,
): string {
  return JSON.stringify({ sections, stopConditions, moderatorConfig }, null, 2);
}

function parseIntoSections(raw: unknown): {
  sections: GuideSection[];
  stopConditions: StopConditions;
  moderatorConfig: ModeratorConfig;
} | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;

  // Flat questions array
  if (Array.isArray(obj)) {
    const qs = (obj as unknown[]).map((q: unknown) => {
      const qo = (q ?? {}) as Record<string, string>;
      return { id: uid(), text: qo.text ?? qo.prompt ?? "", probe: qo.probe ?? "" };
    });
    return {
      sections: [{ id: uid(), title: "Questions", questions: qs }],
      stopConditions: DEFAULT_STOP,
      moderatorConfig: DEFAULT_MOD_CONFIG,
    };
  }

  const rawSections = Array.isArray(obj.sections) ? obj.sections : [];
  const sections: GuideSection[] = rawSections.map((s: unknown) => {
    const so = (s ?? {}) as Record<string, unknown>;
    const qs = (Array.isArray(so.questions) ? so.questions : []).map((q: unknown) => {
      const qo = (q ?? {}) as Record<string, string>;
      return { id: uid(), text: qo.text ?? qo.prompt ?? "", probe: qo.probe ?? "" };
    });
    return { id: uid(), title: String(so.title ?? "Section"), questions: qs };
  });

  const sc = (obj.stopConditions ?? {}) as Record<string, unknown>;
  const mc = (obj.moderatorConfig ?? {}) as Record<string, unknown>;

  return {
    sections,
    stopConditions: {
      maxTurns: Number(sc.maxTurns ?? 30),
      minCoverage: Number(sc.minCoverage ?? 0.7),
    },
    moderatorConfig: {
      systemPrompt: String(mc.systemPrompt ?? ""),
      depthTemperature: Number(mc.depthTemperature ?? 5),
      modality: (mc.modality as ModeratorConfig["modality"]) ?? "voice",
      sufficiencyThreshold: Number(mc.sufficiencyThreshold ?? 0.7),
      maxProbesPerQuestion: Number(mc.maxProbesPerQuestion ?? 2),
    },
  };
}

// ─── Guide Builder Component ──────────────────────────────────────────────────

function GuideBuilder({
  sections,
  stopConditions,
  moderatorConfig,
  onChange,
}: {
  sections: GuideSection[];
  stopConditions: StopConditions;
  moderatorConfig: ModeratorConfig;
  onChange: (s: GuideSection[], sc: StopConditions, mc: ModeratorConfig) => void;
}) {
  const [modOpen, setModOpen] = useState(false);

  const setSections = (s: GuideSection[]) => onChange(s, stopConditions, moderatorConfig);
  const setStop = (sc: StopConditions) => onChange(sections, sc, moderatorConfig);
  const setMod = (mc: ModeratorConfig) => onChange(sections, stopConditions, mc);

  const addSection = () =>
    setSections([...sections, { id: uid(), title: "New section", questions: [] }]);

  const removeSection = (sid: string) => setSections(sections.filter((s) => s.id !== sid));

  const moveSection = (sid: string, dir: -1 | 1) => {
    const idx = sections.findIndex((s) => s.id === sid);
    if (idx + dir < 0 || idx + dir >= sections.length) return;
    const next = [...sections];
    [next[idx], next[idx + dir]] = [next[idx + dir], next[idx]];
    setSections(next);
  };

  const updateSection = (sid: string, patch: Partial<GuideSection>) =>
    setSections(sections.map((s) => (s.id === sid ? { ...s, ...patch } : s)));

  const addQuestion = (sid: string) =>
    updateSection(sid, {
      questions: [
        ...(sections.find((s) => s.id === sid)?.questions ?? []),
        { id: uid(), text: "", probe: "" },
      ],
    });

  const removeQuestion = (sid: string, qid: string) =>
    updateSection(sid, {
      questions: (sections.find((s) => s.id === sid)?.questions ?? []).filter((q) => q.id !== qid),
    });

  const moveQuestion = (sid: string, qid: string, dir: -1 | 1) => {
    const sec = sections.find((s) => s.id === sid);
    if (!sec) return;
    const qs = [...sec.questions];
    const idx = qs.findIndex((q) => q.id === qid);
    if (idx + dir < 0 || idx + dir >= qs.length) return;
    [qs[idx], qs[idx + dir]] = [qs[idx + dir], qs[idx]];
    updateSection(sid, { questions: qs });
  };

  const updateQuestion = (sid: string, qid: string, patch: Partial<GuideQuestion>) =>
    updateSection(sid, {
      questions: (sections.find((s) => s.id === sid)?.questions ?? []).map((q) =>
        q.id === qid ? { ...q, ...patch } : q,
      ),
    });

  const depthLabel = (t: number) => {
    if (t <= 3) return "Quick — moves on swiftly after brief answers";
    if (t <= 6) return "Balanced — follows up when answers seem incomplete";
    return "Deep — explores thoroughly before advancing";
  };

  return (
    <div className="space-y-4">
      {sections.length === 0 && (
        <p className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-sm text-slate-400">
          No sections yet. Click "Add section" to start building your guide.
        </p>
      )}

      {sections.map((sec, si) => (
        <div key={sec.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2">
            <input
              className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={sec.title}
              onChange={(e) => updateSection(sec.id, { title: e.target.value })}
              placeholder="Section title"
            />
            <button
              type="button"
              onClick={() => moveSection(sec.id, -1)}
              disabled={si === 0}
              className="rounded p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
              title="Move up"
            >▲</button>
            <button
              type="button"
              onClick={() => moveSection(sec.id, 1)}
              disabled={si === sections.length - 1}
              className="rounded p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
              title="Move down"
            >▼</button>
            <button
              type="button"
              onClick={() => removeSection(sec.id)}
              className="rounded p-1 text-red-400 hover:text-red-600"
              title="Remove section"
            >✕</button>
          </div>

          <div className="mt-3 space-y-2">
            {sec.questions.map((q, qi) => (
              <div key={q.id} className="rounded-lg border border-slate-200 bg-white p-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1 space-y-2">
                    <input
                      className="w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                      value={q.text}
                      onChange={(e) => updateQuestion(sec.id, q.id, { text: e.target.value })}
                      placeholder="Question text…"
                    />
                    <input
                      className="w-full rounded border border-slate-200 px-2 py-1 text-xs text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-300"
                      value={q.probe}
                      onChange={(e) => updateQuestion(sec.id, q.id, { probe: e.target.value })}
                      placeholder="Probe / follow-up hint (optional)"
                    />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <button type="button" onClick={() => moveQuestion(sec.id, q.id, -1)} disabled={qi === 0} className="rounded px-1 text-xs text-slate-400 hover:text-slate-700 disabled:opacity-30">▲</button>
                    <button type="button" onClick={() => moveQuestion(sec.id, q.id, 1)} disabled={qi === sec.questions.length - 1} className="rounded px-1 text-xs text-slate-400 hover:text-slate-700 disabled:opacity-30">▼</button>
                    <button type="button" onClick={() => removeQuestion(sec.id, q.id)} className="rounded px-1 text-xs text-red-400 hover:text-red-600">✕</button>
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addQuestion(sec.id)}
              className="w-full rounded border border-dashed border-slate-300 py-1 text-xs text-slate-500 hover:border-blue-400 hover:text-blue-600"
            >
              + Add question
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addSection}
        className="w-full rounded-lg border border-dashed border-blue-300 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
      >
        + Add section
      </button>

      {/* Stop conditions */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Stop conditions</h4>
        <div className="mt-3 grid grid-cols-2 gap-4">
          <label className="text-sm text-slate-600">
            Max turns
            <input
              type="number"
              min={1}
              max={200}
              className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              value={stopConditions.maxTurns}
              onChange={(e) => setStop({ ...stopConditions, maxTurns: Number(e.target.value) })}
            />
          </label>
          <label className="text-sm text-slate-600">
            Min coverage ({Math.round(stopConditions.minCoverage * 100)}%)
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              className="mt-2 w-full"
              value={stopConditions.minCoverage}
              onChange={(e) => setStop({ ...stopConditions, minCoverage: Number(e.target.value) })}
            />
          </label>
        </div>
      </div>

      {/* Moderator config */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <button
          type="button"
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-slate-700"
          onClick={() => setModOpen((o) => !o)}
        >
          <span>Moderator settings</span>
          <span className="text-slate-400">{modOpen ? "▲" : "▼"}</span>
        </button>

        {modOpen && (
          <div className="border-t border-slate-100 p-4 space-y-4">
            <label className="block text-sm text-slate-600">
              System prompt — persona, context, tone
              <textarea
                rows={4}
                className="mt-1 w-full rounded border border-slate-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                value={moderatorConfig.systemPrompt}
                onChange={(e) => setMod({ ...moderatorConfig, systemPrompt: e.target.value })}
                placeholder="You are a friendly researcher for Acme Corp studying how customers experience the checkout flow…"
              />
            </label>

            <label className="block text-sm text-slate-600">
              Depth temperature: {moderatorConfig.depthTemperature}
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                className="mt-1 w-full"
                value={moderatorConfig.depthTemperature}
                onChange={(e) => setMod({ ...moderatorConfig, depthTemperature: Number(e.target.value) })}
              />
              <span className="text-xs text-slate-400">{depthLabel(moderatorConfig.depthTemperature)}</span>
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="text-sm text-slate-600">
                Interview modality
                <select
                  className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm"
                  value={moderatorConfig.modality}
                  onChange={(e) => setMod({ ...moderatorConfig, modality: e.target.value as ModeratorConfig["modality"] })}
                >
                  <option value="voice">Voice</option>
                  <option value="text">Text</option>
                  <option value="participant-choice">Participant's choice</option>
                </select>
              </label>

              <label className="text-sm text-slate-600">
                Max probes per question
                <input
                  type="number"
                  min={0}
                  max={5}
                  className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm"
                  value={moderatorConfig.maxProbesPerQuestion}
                  onChange={(e) => setMod({ ...moderatorConfig, maxProbesPerQuestion: Number(e.target.value) })}
                />
              </label>
            </div>

            <label className="block text-sm text-slate-600">
              Sufficiency threshold: {Math.round(moderatorConfig.sufficiencyThreshold * 100)}%
              <input
                type="range"
                min={0.3}
                max={0.95}
                step={0.05}
                className="mt-1 w-full"
                value={moderatorConfig.sufficiencyThreshold}
                onChange={(e) => setMod({ ...moderatorConfig, sufficiencyThreshold: Number(e.target.value) })}
              />
              <span className="text-xs text-slate-400">
                Minimum response quality before the AI moderator advances to the next question.
              </span>
            </label>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StudiesWizardPage() {
  const { apiFetch, user } = useApi();
  const [wizard, setWizard] = useState<WizardState>(defaultState);
  const [step, setStep] = useState(0);
  const [studies, setStudies] = useState<Study[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [guideStatus, setGuideStatus] = useState<string | null>(null);
  const [segmentSummary, setSegmentSummary] = useState<Record<string, number> | null>(null);
  const [quotaStatus, setQuotaStatus] = useState<
    Array<{ segment: string; target: number; actual: number; remaining: number }>
  >([]);

  // Hydrate workspaceId from auth on first load
  useEffect(() => {
    if (!user?.workspaceId) return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setWizard({ ...defaultState, ...JSON.parse(stored) });
        return;
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    // No stored state — pre-fill workspace
    setWizard((prev) => ({ ...prev }));
  }, [user?.workspaceId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wizard));
  }, [wizard]);

  // Fetch projects and studies when workspace is known
  useEffect(() => {
    if (!user?.workspaceId) return;
    apiFetch(`/projects?workspaceId=${user.workspaceId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Project[]) => setProjects(data))
      .catch(() => undefined);
    apiFetch(`/studies?workspaceId=${user.workspaceId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Study[]) => setStudies(data))
      .catch(() => undefined);
  }, [user?.workspaceId]);

  const currentStepLabel = useMemo(() => steps[step] ?? "", [step]);

  // Step gate: which steps are allowed to navigate to
  const stepComplete = useMemo(() => [
    wizard.studyId !== "",      // step 0 → can advance to 1
    wizard.studyId !== "",      // step 1 → guide needs study
    wizard.guideSections.length > 0, // step 2 → recruitment needs guide
    true, true, true,           // steps 3-5: always accessible
  ], [wizard.studyId, wizard.guideSections.length]);

  const canAdvance = (fromStep: number) => stepComplete[fromStep] ?? true;

  const goNext = () => {
    if (!canAdvance(step)) return;
    setStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  // ── API actions ────────────────────────────────────────────────────────────

  const createStudy = async () => {
    if (!wizard.name.trim()) { setStatus("Study name is required."); return; }
    setStatus("Creating study...");
    const res = await apiFetch("/studies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspaceId: user?.workspaceId ?? "",
        projectId: wizard.projectId,
        name: wizard.name.trim(),
        status: wizard.status,
        language: wizard.language,
        mode: wizard.mode,
      }),
    });
    if (!res.ok) { setStatus("Failed to create study."); return; }
    const created = (await res.json()) as Study;
    setWizard((prev) => ({ ...prev, studyId: created.id }));
    setStatus("Study created.");
    // Refresh studies list
    const listRes = await apiFetch(`/studies?workspaceId=${user?.workspaceId ?? ""}`);
    if (listRes.ok) setStudies(await listRes.json());
  };

  const buildGuide = async () => {
    if (!wizard.studyId) { setGuideStatus("Select a study first."); return; }
    setGuideStatus("Generating guide...");
    const res = await apiFetch(`/studies/${wizard.studyId}/build`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brief: wizard.brief }),
    });
    if (!res.ok) { setGuideStatus("Guide generation failed."); return; }
    const payload = await res.json();
    const raw = payload.interviewGuide ?? payload;
    const parsed = parseIntoSections(raw);
    if (parsed) {
      setWizard((prev) => ({
        ...prev,
        guideSections: parsed.sections,
        guideStopConditions: parsed.stopConditions,
        guideModeratorConfig: parsed.moderatorConfig,
      }));
      setGuideStatus("Guide generated.");
    } else {
      setGuideStatus("Guide generated (could not parse into visual editor — raw JSON returned).");
    }
  };

  const saveGuide = async () => {
    if (!wizard.studyId) { setGuideStatus("Select a study first."); return; }
    if (wizard.guideSections.length === 0) { setGuideStatus("Add at least one section with a question."); return; }
    const guide = {
      sections: wizard.guideSections,
      stopConditions: wizard.guideStopConditions,
      moderatorConfig: wizard.guideModeratorConfig,
    };
    setGuideStatus("Saving guide...");
    const res = await apiFetch(`/studies/${wizard.studyId}/guide`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guide }),
    });
    setGuideStatus(res.ok ? "Guide saved." : "Failed to save guide.");
  };

  const saveRecruitment = async () => {
    if (!wizard.studyId) { setStatus("Select a study first."); return; }
    const quotas = safeJsonParse(wizard.quotasJson);
    const screening = safeJsonParse(wizard.screeningJson);
    const recruitmentChecklist = safeJsonParse(wizard.recruitmentChecklistJson);
    const localizationChecklist = safeJsonParse(wizard.localizationChecklistJson);
    if (!quotas || !screening || !recruitmentChecklist || !localizationChecklist) {
      setStatus("All JSON fields must be valid.");
      return;
    }
    setStatus("Saving recruitment settings...");
    await Promise.all([
      apiFetch(`/studies/${wizard.studyId}/quotas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quotaTargets: quotas }),
      }),
      apiFetch(`/studies/${wizard.studyId}/recruitment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checklist: recruitmentChecklist }),
      }),
      apiFetch(`/studies/${wizard.studyId}/localization`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checklist: localizationChecklist }),
      }),
    ]);
    setStatus("Recruitment settings saved.");
  };

  const saveActivation = async () => {
    if (!wizard.studyId) { setStatus("Select a study first."); return; }
    const activationChecklist = safeJsonParse(wizard.activationChecklistJson);
    const rolloutPlan = safeJsonParse(wizard.rolloutPlanJson);
    const distributionTracking = safeJsonParse(wizard.distributionTrackingJson);
    if (!activationChecklist || !rolloutPlan || !distributionTracking) {
      setStatus("Activation JSON payloads must be valid."); return;
    }
    setStatus("Saving activation settings...");
    await Promise.all([
      apiFetch(`/studies/${wizard.studyId}/activation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checklist: activationChecklist }),
      }),
      apiFetch(`/studies/${wizard.studyId}/rollout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rolloutPlan }),
      }),
      apiFetch(`/studies/${wizard.studyId}/distribution`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ distributionTracking }),
      }),
    ]);
    setStatus("Activation settings saved.");
  };

  const refreshRunMetrics = async () => {
    if (!wizard.studyId) return;
    const [segmentsRes, quotaRes] = await Promise.all([
      apiFetch(`/studies/${wizard.studyId}/segment-summary`),
      apiFetch(`/studies/${wizard.studyId}/quota-status`),
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

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen px-8 py-10">
      <h1 className="text-2xl font-semibold">Study wizard</h1>
      <p className="mt-2 text-sm text-gray-600">
        Step-by-step setup for briefs, recruitment, moderation, and activation.
      </p>

      {/* Step indicators */}
      <section className="mt-6 flex flex-wrap items-center gap-2 text-xs text-gray-500">
        {steps.map((label, index) => {
          const done = stepComplete[index - 1] !== false && index > 0 && wizard.studyId !== "";
          const locked = index > 0 && !stepComplete[index - 1];
          return (
            <button
              key={label}
              type="button"
              onClick={() => !locked && setStep(index)}
              disabled={locked && index > step}
              title={locked ? "Complete previous steps first" : undefined}
              className={`rounded-full border px-3 py-1 transition-colors ${
                step === index
                  ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                  : done
                  ? "border-green-300 text-green-700"
                  : locked
                  ? "border-gray-100 text-gray-300 cursor-not-allowed"
                  : "border-gray-200 hover:border-gray-400"
              }`}
            >
              {done && index < step ? "✓ " : ""}{index + 1}. {label}
            </button>
          );
        })}
      </section>

      <section className="mt-6 max-w-3xl rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{currentStepLabel}</h2>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Study</span>
            <select
              className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
              value={wizard.studyId}
              onChange={(e) => setWizard((prev) => ({ ...prev, studyId: e.target.value }))}
            >
              <option value="">Select study</option>
              {studies.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Step 0: Objective ──────────────────────────────────────────── */}
        {step === 0 && (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="text-sm text-gray-600 md:col-span-2">
              Project
              <select
                className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-sm"
                value={wizard.projectId}
                onChange={(e) => setWizard((prev) => ({ ...prev, projectId: e.target.value }))}
              >
                <option value="">Select project…</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              {projects.length === 0 && (
                <p className="mt-1 text-xs text-slate-400">No projects found. <a href="/projects" className="underline">Create one first.</a></p>
              )}
            </label>
            <label className="text-sm text-gray-600 md:col-span-2">
              Study name
              <input
                className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-sm"
                value={wizard.name}
                onChange={(e) => setWizard((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Checkout experience exploration"
              />
            </label>
            <label className="text-sm text-gray-600 md:col-span-2">
              Objective
              <textarea
                className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-sm"
                rows={3}
                value={wizard.objective}
                onChange={(e) => setWizard((prev) => ({ ...prev, objective: e.target.value }))}
                placeholder="What decision should this study inform?"
              />
            </label>
            <label className="text-sm text-gray-600">
              Status
              <select
                className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-sm"
                value={wizard.status}
                onChange={(e) => setWizard((prev) => ({ ...prev, status: e.target.value }))}
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
                onChange={(e) => setWizard((prev) => ({ ...prev, language: e.target.value }))}
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
              </select>
            </label>
            <label className="text-sm text-gray-600">
              Default mode
              <select
                className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-sm"
                value={wizard.mode}
                onChange={(e) => setWizard((prev) => ({ ...prev, mode: e.target.value }))}
              >
                <option value="voice">Voice</option>
                <option value="text">Text</option>
              </select>
            </label>
            <div className="md:col-span-2">
              <button type="button" onClick={createStudy}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                Create study
              </button>
              {status && <p className="mt-2 text-xs text-gray-500">{status}</p>}
            </div>
          </div>
        )}

        {/* ── Step 1: Segments & markets ────────────────────────────────── */}
        {step === 1 && (
          <div className="mt-4 grid gap-3">
            <label className="text-sm text-gray-600">
              Target segments (comma separated)
              <input
                className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-sm"
                value={wizard.segments}
                onChange={(e) => setWizard((prev) => ({ ...prev, segments: e.target.value }))}
                placeholder="e.g. power users, switchers, churned"
              />
            </label>
            <label className="text-sm text-gray-600">
              Markets
              <input
                className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-sm"
                value={wizard.markets}
                onChange={(e) => setWizard((prev) => ({ ...prev, markets: e.target.value }))}
              />
            </label>
            <p className="text-xs text-gray-500">
              Use the recruitment step to translate segments and markets into screening logic and quotas.
            </p>
          </div>
        )}

        {/* ── Step 2: Guide builder (L1 + L5) ──────────────────────────── */}
        {step === 2 && (
          <div className="mt-4 space-y-4">
            {!wizard.studyId && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                Create a study in Step 1 before building the guide.
              </div>
            )}
            <label className="block text-sm text-gray-600">
              Brief (optional — used to generate the guide with AI)
              <textarea
                className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-sm"
                rows={3}
                value={wizard.brief}
                onChange={(e) => setWizard((prev) => ({ ...prev, brief: e.target.value }))}
                placeholder="Paste the study brief here to generate the guide."
              />
            </label>
            <div className="flex flex-wrap gap-2 text-xs">
              <button type="button" onClick={buildGuide}
                className="rounded-full border border-blue-500 px-3 py-1 font-medium text-blue-600">
                Generate guide from brief
              </button>
              <button type="button" onClick={saveGuide}
                className="rounded-full border border-gray-200 px-3 py-1 text-gray-600">
                Save guide
              </button>
              {guideStatus && <span className="text-xs text-gray-500">{guideStatus}</span>}
            </div>

            <GuideBuilder
              sections={wizard.guideSections}
              stopConditions={wizard.guideStopConditions}
              moderatorConfig={wizard.guideModeratorConfig}
              onChange={(sections, stopConditions, moderatorConfig) =>
                setWizard((prev) => ({ ...prev, guideSections: sections, guideStopConditions: stopConditions, guideModeratorConfig: moderatorConfig }))
              }
            />
          </div>
        )}

        {/* ── Step 3: Recruitment ───────────────────────────────────────── */}
        {step === 3 && (
          <div className="mt-4 grid gap-3">
            <label className="text-sm text-gray-600">
              Screening logic (JSON)
              <textarea
                className="mt-1 w-full rounded-lg border border-gray-200 p-2 font-mono text-xs"
                rows={6}
                value={wizard.screeningJson}
                onChange={(e) => setWizard((prev) => ({ ...prev, screeningJson: e.target.value }))}
              />
            </label>
            <label className="text-sm text-gray-600">
              Quota targets (JSON)
              <textarea
                className="mt-1 w-full rounded-lg border border-gray-200 p-2 font-mono text-xs"
                rows={5}
                value={wizard.quotasJson}
                onChange={(e) => setWizard((prev) => ({ ...prev, quotasJson: e.target.value }))}
              />
            </label>
            <label className="text-sm text-gray-600">
              Recruitment checklist (JSON)
              <textarea
                className="mt-1 w-full rounded-lg border border-gray-200 p-2 font-mono text-xs"
                rows={4}
                value={wizard.recruitmentChecklistJson}
                onChange={(e) => setWizard((prev) => ({ ...prev, recruitmentChecklistJson: e.target.value }))}
              />
            </label>
            <label className="text-sm text-gray-600">
              Localization checklist (JSON)
              <textarea
                className="mt-1 w-full rounded-lg border border-gray-200 p-2 font-mono text-xs"
                rows={4}
                value={wizard.localizationChecklistJson}
                onChange={(e) => setWizard((prev) => ({ ...prev, localizationChecklistJson: e.target.value }))}
              />
            </label>
            <button type="button" onClick={saveRecruitment}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Save recruitment setup
            </button>
            {status && <p className="text-xs text-gray-500">{status}</p>}
          </div>
        )}

        {/* ── Step 4: Run ───────────────────────────────────────────────── */}
        {step === 4 && (
          <div className="mt-4 grid gap-4">
            <div className="rounded-xl border border-gray-100 p-4">
              <div className="text-xs uppercase text-gray-500">Session monitoring</div>
              <p className="mt-2 text-xs text-gray-500">
                Track quotas and participant distribution while interviews are running.
              </p>
              <button type="button" onClick={refreshRunMetrics}
                className="mt-3 rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600">
                Refresh metrics
              </button>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-gray-100 p-3 text-xs text-gray-500">
                  <div className="text-xs uppercase text-gray-400">Segments</div>
                  {segmentSummary
                    ? Object.entries(segmentSummary).map(([seg, count]) => (
                        <div key={seg} className="mt-1">{seg}: {count}</div>
                      ))
                    : <p className="mt-2">No segment data yet.</p>
                  }
                </div>
                <div className="rounded-lg border border-gray-100 p-3 text-xs text-gray-500">
                  <div className="text-xs uppercase text-gray-400">Quota status</div>
                  {quotaStatus.length
                    ? quotaStatus.map((q) => (
                        <div key={q.segment} className="mt-1">
                          {q.segment}: {q.actual}/{q.target} (remaining {q.remaining})
                        </div>
                      ))
                    : <p className="mt-2">No quota status yet.</p>
                  }
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-gray-100 p-4 text-xs text-gray-500">
              Use Fieldwork to generate and share participant links.{" "}
              <a href="/fieldwork" className="text-blue-600 underline">Open Fieldwork →</a>
            </div>
          </div>
        )}

        {/* ── Step 5: Analyze ───────────────────────────────────────────── */}
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
            <div className="flex gap-2 text-xs">
              <a href="/insights" className="rounded-full border border-gray-200 px-3 py-1 text-gray-600">Open insights</a>
              <a href="/reports" className="rounded-full border border-gray-200 px-3 py-1 text-gray-600">Open reports</a>
            </div>
          </div>
        )}

        {/* ── Step 6: Activate ──────────────────────────────────────────── */}
        {step === 6 && (
          <div className="mt-4 grid gap-3">
            <label className="text-sm text-gray-600">
              Activation checklist (JSON)
              <textarea
                className="mt-1 w-full rounded-lg border border-gray-200 p-2 font-mono text-xs"
                rows={4}
                value={wizard.activationChecklistJson}
                onChange={(e) => setWizard((prev) => ({ ...prev, activationChecklistJson: e.target.value }))}
              />
            </label>
            <label className="text-sm text-gray-600">
              Rollout plan (JSON)
              <textarea
                className="mt-1 w-full rounded-lg border border-gray-200 p-2 font-mono text-xs"
                rows={4}
                value={wizard.rolloutPlanJson}
                onChange={(e) => setWizard((prev) => ({ ...prev, rolloutPlanJson: e.target.value }))}
              />
            </label>
            <label className="text-sm text-gray-600">
              Distribution tracking (JSON)
              <textarea
                className="mt-1 w-full rounded-lg border border-gray-200 p-2 font-mono text-xs"
                rows={4}
                value={wizard.distributionTrackingJson}
                onChange={(e) => setWizard((prev) => ({ ...prev, distributionTrackingJson: e.target.value }))}
              />
            </label>
            <div className="flex flex-wrap gap-2 text-xs">
              <button type="button" onClick={saveActivation}
                className="rounded-full border border-blue-500 px-3 py-1 font-medium text-blue-600">
                Save activation setup
              </button>
              <a href="/stories" className="rounded-full border border-gray-200 px-3 py-1 text-gray-600">Open story builder</a>
              <a href="/stakeholder" className="rounded-full border border-gray-200 px-3 py-1 text-gray-600">Open stakeholder portal</a>
            </div>
            {status && <p className="text-xs text-gray-500">{status}</p>}
          </div>
        )}

        {/* Step navigation */}
        <div className="mt-6 flex items-center justify-between text-xs">
          <button type="button"
            onClick={() => setStep((prev) => Math.max(prev - 1, 0))}
            className="rounded-full border border-gray-200 px-3 py-1 text-gray-600 hover:bg-gray-50">
            Previous
          </button>
          <div className="text-gray-400">Step {step + 1} of {steps.length}</div>
          <button
            type="button"
            onClick={goNext}
            disabled={!canAdvance(step)}
            title={!canAdvance(step) ? "Complete this step first" : undefined}
            className="rounded-full border border-gray-200 px-3 py-1 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </section>
    </main>
  );
}
