"use client";

import { useEffect, useMemo, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const HEADERS = { "x-workspace-id": "demo-workspace-id", "x-user-id": "demo-user" };

type Project = { id: string; name: string };
type Study = {
  id: string;
  name: string;
  status: string;
  language?: string;
  mode?: string;
  allowMultipleEntries?: boolean;
  allowIncomplete?: boolean;
  syntheticEnabled?: boolean;
  screeningLogic?: Record<string, unknown>;
  interviewGuide?: Record<string, unknown>;
  quotaTargets?: Record<string, number>;
  localizationChecklist?: Record<string, boolean>;
  recruitmentChecklist?: Record<string, boolean>;
  activationChecklist?: Record<string, boolean>;
  rolloutPlan?: { markets?: string[]; status?: string };
  distributionTracking?: { channels?: string[]; measurement?: string };
  deliveryHealth?: { score?: number; status?: string; notes?: string };
};

type Participant = {
  id: string;
  email: string;
  segment?: string;
  verificationStatus?: string;
  fraudScore?: number | null;
  verifiedAt?: string | null;
};

type EvidenceCoverage = {
  studyId: string;
  gapCount: number;
  gaps: { insightId: string; statement: string }[];
  coverage: { insightId: string; clipCount: number; transcriptSpanCount: number }[];
};

type AnalysisSummary = {
  studyId: string;
  evidenceCoverage?: {
    insightsWithEvidence: number;
    totalInsights: number;
    coverageRate: number;
    clipsPerInsight: number;
  };
};

export default function StudiesPage() {
  const supportedLanguages = [
    "en",
    "es",
    "fr",
    "de",
    "it",
    "pt",
    "nl",
    "sv",
    "no",
    "da",
    "fi",
    "pl",
    "cs",
    "tr",
    "ar",
    "he",
    "hi",
    "bn",
    "ur",
    "ja",
    "ko",
    "zh",
  ];
  const [projects, setProjects] = useState<Project[]>([]);
  const [studies, setStudies] = useState<Study[]>([]);
  const [name, setName] = useState("New study");
  const [projectId, setProjectId] = useState("");
  const [language, setLanguage] = useState("en");
  const [mode, setMode] = useState("voice");
  const [allowMultipleEntries, setAllowMultipleEntries] = useState(false);
  const [allowIncomplete, setAllowIncomplete] = useState(false);
  const [syntheticEnabled, setSyntheticEnabled] = useState(false);
  const [brief, setBrief] = useState("");
  const [buildStudyId, setBuildStudyId] = useState("");
  const [syntheticStudyId, setSyntheticStudyId] = useState("");
  const [syntheticPrompt, setSyntheticPrompt] = useState("");
  const [syntheticAnswer, setSyntheticAnswer] = useState("");
  const [recruitStudyId, setRecruitStudyId] = useState("");
  const [recruitCount, setRecruitCount] = useState(10);
  const [recruitSegment, setRecruitSegment] = useState("core");
  const [segmentSummary, setSegmentSummary] = useState<Record<string, number>>({});
  const [segmentStudyId, setSegmentStudyId] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [localizationStudyId, setLocalizationStudyId] = useState("");
  const [localizationChecklist, setLocalizationChecklist] = useState<Record<string, boolean>>({
    consentLocalized: false,
    recruitmentCopyLocalized: false,
    moderatorAvailable: false,
    incentivesLocalized: false,
    legalReviewed: false,
  });
  const [recruitmentStudyId, setRecruitmentStudyId] = useState("");
  const [recruitmentChecklist, setRecruitmentChecklist] = useState<Record<string, boolean>>({
    targetSegmentsDefined: false,
    screeningQuestionsReady: false,
    sampleQuotaSet: false,
    fraudChecksEnabled: false,
    incentivesApproved: false,
  });
  const [quotaStudyId, setQuotaStudyId] = useState("");
  const [quotaTargetsInput, setQuotaTargetsInput] = useState("{\n  \"core\": 10,\n  \"edge\": 5\n}");
  const [quotaStatus, setQuotaStatus] = useState<{ segment: string; target: number; actual: number }[]>([]);
  const [quotaStatusMessage, setQuotaStatusMessage] = useState("");
  const [analysisStudyId, setAnalysisStudyId] = useState("");
  const [analysisSummary, setAnalysisSummary] = useState<AnalysisSummary | null>(null);
  const [evidenceCoverage, setEvidenceCoverage] = useState<EvidenceCoverage | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState("");
  const [activationStudyId, setActivationStudyId] = useState("");
  const [activationChecklist, setActivationChecklist] = useState<Record<string, boolean>>({
    executiveBriefReady: false,
    storyAssetsPackaged: false,
    stakeholderCommsPlanned: false,
    evidenceBundleAttached: false,
    measurementPlanSet: false,
  });
  const [rolloutStudyId, setRolloutStudyId] = useState("");
  const [rolloutMarkets, setRolloutMarkets] = useState("");
  const [rolloutStatus, setRolloutStatus] = useState("draft");
  const [distributionStudyId, setDistributionStudyId] = useState("");
  const [distributionChannels, setDistributionChannels] = useState("");
  const [distributionMeasurement, setDistributionMeasurement] = useState("");
  const [deliveryStudyId, setDeliveryStudyId] = useState("");
  const [deliveryScore, setDeliveryScore] = useState(0);
  const [deliveryStatus, setDeliveryStatus] = useState("unknown");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const hasProjects = projects.length > 0;

  const loadData = () => {
    fetch(`${API_BASE}/projects?workspaceId=demo-workspace-id`, { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : []))
      .then(setProjects);
    fetch(`${API_BASE}/studies?workspaceId=demo-workspace-id`, { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : []))
      .then(setStudies);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!projectId && projects.length > 0) {
      setProjectId(projects[0].id);
    }
  }, [projects, projectId]);

  const loadParticipants = async (studyId: string) => {
    if (!studyId) return;
    const res = await fetch(`${API_BASE}/participants?studyId=${studyId}`, { headers: HEADERS });
    if (!res.ok) return;
    const payload = await res.json();
    setParticipants(payload ?? []);
  };

  const loadQuotaStatus = async (studyId: string) => {
    if (!studyId) return;
    const res = await fetch(`${API_BASE}/studies/${studyId}/quota-status`, { headers: HEADERS });
    if (!res.ok) return;
    const payload = await res.json();
    setQuotaStatus(payload?.status ?? []);
  };

  const loadAnalysis = async (studyId: string) => {
    if (!studyId) return;
    setAnalysisStatus("Loading analysis...");
    const [summaryRes, coverageRes] = await Promise.all([
      fetch(`${API_BASE}/analysis/study/${studyId}/summary`, { headers: HEADERS }),
      fetch(`${API_BASE}/analysis/study/${studyId}/evidence-coverage`, { headers: HEADERS }),
    ]);
    setAnalysisSummary(summaryRes.ok ? await summaryRes.json() : null);
    setEvidenceCoverage(coverageRes.ok ? await coverageRes.json() : null);
    setAnalysisStatus(summaryRes.ok && coverageRes.ok ? "" : "Failed to load analysis.");
  };

  useEffect(() => {
    if (!recruitStudyId) {
      setParticipants([]);
      return;
    }
    loadParticipants(recruitStudyId);
  }, [recruitStudyId]);

  useEffect(() => {
    if (!quotaStudyId) {
      setQuotaStatus([]);
      return;
    }
    const current = studies.find((study) => study.id === quotaStudyId);
    if (current?.quotaTargets) {
      setQuotaTargetsInput(JSON.stringify(current.quotaTargets, null, 2));
    }
    void loadQuotaStatus(quotaStudyId);
  }, [quotaStudyId, studies]);

  useEffect(() => {
    if (!analysisStudyId) {
      setAnalysisSummary(null);
      setEvidenceCoverage(null);
      return;
    }
    void loadAnalysis(analysisStudyId);
  }, [analysisStudyId]);

  useEffect(() => {
    if (!localizationStudyId) return;
    const current = studies.find((study) => study.id === localizationStudyId);
    if (current?.localizationChecklist) {
      setLocalizationChecklist((prev) => ({ ...prev, ...current.localizationChecklist }));
    }
  }, [localizationStudyId, studies]);

  useEffect(() => {
    if (!recruitmentStudyId) return;
    const current = studies.find((study) => study.id === recruitmentStudyId);
    if (current?.recruitmentChecklist) {
      setRecruitmentChecklist((prev) => ({ ...prev, ...current.recruitmentChecklist }));
    }
  }, [recruitmentStudyId, studies]);

  useEffect(() => {
    if (!activationStudyId) return;
    const current = studies.find((study) => study.id === activationStudyId);
    if (current?.activationChecklist) {
      setActivationChecklist((prev) => ({ ...prev, ...current.activationChecklist }));
    }
  }, [activationStudyId, studies]);

  useEffect(() => {
    if (!rolloutStudyId) return;
    const current = studies.find((study) => study.id === rolloutStudyId);
    if (current?.rolloutPlan) {
      setRolloutMarkets((current.rolloutPlan.markets ?? []).join(", "));
      setRolloutStatus(current.rolloutPlan.status ?? "draft");
    }
  }, [rolloutStudyId, studies]);

  useEffect(() => {
    if (!distributionStudyId) return;
    const current = studies.find((study) => study.id === distributionStudyId);
    if (current?.distributionTracking) {
      setDistributionChannels((current.distributionTracking.channels ?? []).join(", "));
      setDistributionMeasurement(current.distributionTracking.measurement ?? "");
    }
  }, [distributionStudyId, studies]);

  useEffect(() => {
    if (!deliveryStudyId) return;
    const current = studies.find((study) => study.id === deliveryStudyId);
    if (current?.deliveryHealth) {
      setDeliveryScore(current.deliveryHealth.score ?? 0);
      setDeliveryStatus(current.deliveryHealth.status ?? "unknown");
      setDeliveryNotes(current.deliveryHealth.notes ?? "");
    }
  }, [deliveryStudyId, studies]);

  const studyOptions = useMemo(() => studies.map((study) => study.id), [studies]);

  const createStudy = async () => {
    if (!hasProjects || !projectId) {
      setStatusMessage("Add a project before creating a study.");
      return;
    }
    setStatusMessage("");
    const res = await fetch(`${API_BASE}/studies`, {
      method: "POST",
      headers: { ...HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({
        workspaceId: "demo-workspace-id",
        projectId,
        name,
        status: "draft",
        language,
        mode,
        allowMultipleEntries,
        allowIncomplete,
        syntheticEnabled,
      }),
    });
    if (!res.ok) {
      setStatusMessage("Failed to create study.");
      return;
    }
    setStatusMessage("Study created.");
    loadData();
  };

  const buildStudy = async () => {
    if (!buildStudyId || !brief.trim()) return;
    setStatusMessage("");
    const res = await fetch(`${API_BASE}/studies/${buildStudyId}/build`, {
      method: "POST",
      headers: { ...HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({ brief }),
    });
    if (!res.ok) {
      setStatusMessage("Failed to build study.");
      return;
    }
    setStatusMessage("Interview guide generated from brief.");
    setBrief("");
    loadData();
  };

  const generateSynthetic = async () => {
    if (!syntheticStudyId || !syntheticPrompt.trim()) return;
    setStatusMessage("");
    const res = await fetch(`${API_BASE}/studies/${syntheticStudyId}/synthetic-answer`, {
      method: "POST",
      headers: { ...HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: syntheticPrompt }),
    });
    if (!res.ok) {
      setStatusMessage("Failed to generate synthetic answer.");
      return;
    }
    const payload = await res.json();
    setSyntheticAnswer(payload.answer ?? "");
    setStatusMessage("Synthetic preview generated.");
  };

  const recruitParticipants = async () => {
    if (!recruitStudyId) return;
    setStatusMessage("");
    const res = await fetch(`${API_BASE}/participants/recruit`, {
      method: "POST",
      headers: { ...HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({
        studyId: recruitStudyId,
        count: recruitCount,
        source: "panel",
        segment: recruitSegment,
      }),
    });
    if (!res.ok) {
      setStatusMessage("Failed to recruit participants.");
      return;
    }
    setStatusMessage("Participants recruited.");
    await loadParticipants(recruitStudyId);
  };

  const updateVerification = async (participantId: string, status: "verified" | "flagged" | "rejected") => {
    if (!participantId) return;
    setVerificationLoading(true);
    const res = await fetch(`${API_BASE}/participants/${participantId}/verify`, {
      method: "PATCH",
      headers: { ...HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({ status, fraudScore: status === "verified" ? 0 : 70 }),
    });
    setVerificationLoading(false);
    if (!res.ok) {
      setStatusMessage("Failed to update verification status.");
      return;
    }
    await loadParticipants(recruitStudyId);
  };

  const loadSegmentSummary = async () => {
    if (!segmentStudyId) return;
    const res = await fetch(`${API_BASE}/studies/${segmentStudyId}/segment-summary`, { headers: HEADERS });
    if (!res.ok) {
      setStatusMessage("Failed to load segment summary.");
      return;
    }
    const data = await res.json();
    setSegmentSummary(data.segments ?? {});
  };

  const saveLocalizationChecklist = async () => {
    if (!localizationStudyId) return;
    const res = await fetch(`${API_BASE}/studies/${localizationStudyId}/localization`, {
      method: "POST",
      headers: { ...HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({ checklist: localizationChecklist }),
    });
    setStatusMessage(res.ok ? "Localization checklist saved." : "Failed to save localization checklist.");
    if (res.ok) {
      loadData();
    }
  };

  const saveRecruitmentChecklist = async () => {
    if (!recruitmentStudyId) return;
    const res = await fetch(`${API_BASE}/studies/${recruitmentStudyId}/recruitment`, {
      method: "POST",
      headers: { ...HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({ checklist: recruitmentChecklist }),
    });
    setStatusMessage(res.ok ? "Recruitment checklist saved." : "Failed to save recruitment checklist.");
    if (res.ok) {
      loadData();
    }
  };

  const saveQuotaTargets = async () => {
    if (!quotaStudyId) return;
    try {
      const parsed = JSON.parse(quotaTargetsInput) as Record<string, number>;
      const res = await fetch(`${API_BASE}/studies/${quotaStudyId}/quotas`, {
        method: "POST",
        headers: { ...HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify({ quotaTargets: parsed }),
      });
      setQuotaStatusMessage(res.ok ? "Quota targets saved." : "Failed to save quota targets.");
      if (res.ok) {
        await loadQuotaStatus(quotaStudyId);
        loadData();
      }
    } catch (error) {
      setQuotaStatusMessage("Quota targets must be valid JSON.");
    }
  };

  const saveActivationChecklist = async () => {
    if (!activationStudyId) return;
    const res = await fetch(`${API_BASE}/studies/${activationStudyId}/activation`, {
      method: "POST",
      headers: { ...HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({ checklist: activationChecklist }),
    });
    setStatusMessage(res.ok ? "Activation checklist saved." : "Failed to save activation checklist.");
    if (res.ok) {
      loadData();
    }
  };

  const saveRolloutPlan = async () => {
    if (!rolloutStudyId) return;
    const markets = rolloutMarkets
      .split(",")
      .map((market) => market.trim())
      .filter(Boolean);
    const res = await fetch(`${API_BASE}/studies/${rolloutStudyId}/rollout`, {
      method: "POST",
      headers: { ...HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({ rolloutPlan: { markets, status: rolloutStatus } }),
    });
    setStatusMessage(res.ok ? "Rollout plan saved." : "Failed to save rollout plan.");
    if (res.ok) {
      loadData();
    }
  };

  const saveDistributionTracking = async () => {
    if (!distributionStudyId) return;
    const channels = distributionChannels
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
    const res = await fetch(`${API_BASE}/studies/${distributionStudyId}/distribution`, {
      method: "POST",
      headers: { ...HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({ distributionTracking: { channels, measurement: distributionMeasurement } }),
    });
    setStatusMessage(res.ok ? "Distribution tracking saved." : "Failed to save distribution tracking.");
    if (res.ok) {
      loadData();
    }
  };

  const saveDeliveryHealth = async () => {
    if (!deliveryStudyId) return;
    const res = await fetch(`${API_BASE}/studies/${deliveryStudyId}/delivery-health`, {
      method: "POST",
      headers: { ...HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({
        deliveryHealth: { score: deliveryScore, status: deliveryStatus, notes: deliveryNotes },
      }),
    });
    setStatusMessage(res.ok ? "Delivery health saved." : "Failed to save delivery health.");
    if (res.ok) {
      loadData();
    }
  };

  return (
    <div className="space-y-8 p-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Studies</h1>
        <p className="mt-2 text-sm text-slate-600">
          Create AI-moderated studies with language, screening, and synthetic previews.
        </p>
        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
          <div className="text-xs uppercase text-slate-500">Global interview readiness</div>
          <p className="mt-2 text-xs text-slate-500">
            Supported languages cover core enterprise markets. Configure localization, consent, and
            recruitment guidance before launch.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-500">
            {supportedLanguages.map((lang) => (
              <span key={lang} className="rounded-full border border-slate-200 px-2 py-1">
                {lang.toUpperCase()}
              </span>
            ))}
          </div>
          {!supportedLanguages.includes(language) && language.trim() !== "" && (
            <p className="mt-3 text-xs text-amber-600">
              Language {language.toUpperCase()} is not in the current ready list. Confirm moderator
              availability and translations before fieldwork.
            </p>
          )}
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="text-sm text-slate-600">
            Study name
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 p-2"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label className="text-sm text-slate-600">
            Project
            <select
              className="mt-1 w-full rounded-lg border border-slate-200 p-2"
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-600">
            Language
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 p-2"
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
            />
          </label>
          <label className="text-sm text-slate-600">
            Mode
            <select
              className="mt-1 w-full rounded-lg border border-slate-200 p-2"
              value={mode}
              onChange={(event) => setMode(event.target.value)}
            >
              <option value="voice">Voice</option>
              <option value="text">Text</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={allowMultipleEntries}
              onChange={(event) => setAllowMultipleEntries(event.target.checked)}
            />
            Allow multiple entries
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={allowIncomplete}
              onChange={(event) => setAllowIncomplete(event.target.checked)}
            />
            Allow incomplete screening
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={syntheticEnabled}
              onChange={(event) => setSyntheticEnabled(event.target.checked)}
            />
            Enable synthetic previews
          </label>
        </div>
        <button
          className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          onClick={createStudy}
          disabled={!hasProjects || !projectId}
        >
          Create study
        </button>
        {!hasProjects && (
          <p className="mt-2 text-xs text-slate-500">
            No projects found. Create a project first to begin a study.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Brief Builder</h2>
        <p className="mt-1 text-sm text-slate-600">Upload a brief and generate an interview guide.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <label className="text-sm text-slate-600 md:col-span-1">
            Study
            <select
              className="mt-1 w-full rounded-lg border border-slate-200 p-2"
              value={buildStudyId}
              onChange={(event) => setBuildStudyId(event.target.value)}
            >
              <option value="">Select study</option>
              {studyOptions.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-600 md:col-span-2">
            Brief
            <textarea
              className="mt-1 w-full rounded-lg border border-slate-200 p-2"
              rows={4}
              value={brief}
              onChange={(event) => setBrief(event.target.value)}
            />
          </label>
        </div>
        <button
          className="mt-3 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
          onClick={buildStudy}
        >
          Generate guide
        </button>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Synthetic Preview</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <label className="text-sm text-slate-600">
            Study
            <select
              className="mt-1 w-full rounded-lg border border-slate-200 p-2"
              value={syntheticStudyId}
              onChange={(event) => setSyntheticStudyId(event.target.value)}
            >
              <option value="">Select study</option>
              {studyOptions.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-600 md:col-span-2">
            Prompt
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 p-2"
              value={syntheticPrompt}
              onChange={(event) => setSyntheticPrompt(event.target.value)}
            />
          </label>
        </div>
        <button
          className="mt-3 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
          onClick={generateSynthetic}
        >
          Generate preview
        </button>
        {syntheticAnswer && (
          <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
            {syntheticAnswer}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Recruitment</h2>
        <p className="mt-1 text-sm text-slate-600">Simulate panel recruitment at scale.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <label className="text-sm text-slate-600">
            Study
            <select
              className="mt-1 w-full rounded-lg border border-slate-200 p-2"
              value={recruitStudyId}
              onChange={(event) => setRecruitStudyId(event.target.value)}
            >
              <option value="">Select study</option>
              {studyOptions.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-600">
            Count
            <input
              type="number"
              min={1}
              max={200}
              className="mt-1 w-full rounded-lg border border-slate-200 p-2"
              value={recruitCount}
              onChange={(event) => setRecruitCount(Number(event.target.value))}
            />
          </label>
          <label className="text-sm text-slate-600">
            Segment
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 p-2"
              value={recruitSegment}
              onChange={(event) => setRecruitSegment(event.target.value)}
              placeholder="e.g. core"
            />
          </label>
        </div>
        <button
          className="mt-3 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
          onClick={recruitParticipants}
        >
          Recruit participants
        </button>
        {participants.length > 0 ? (
          <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="text-xs uppercase text-slate-500">Verification queue</div>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {participants.slice(0, 8).map((participant) => (
                <li key={participant.id} className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-medium">{participant.email}</div>
                      <div className="text-xs text-slate-500">
                        Segment {participant.segment ?? "unassigned"} · Status{" "}
                        {participant.verificationStatus ?? "pending"}
                        {participant.fraudScore !== null && participant.fraudScore !== undefined
                          ? ` · Fraud score ${participant.fraudScore}`
                          : ""}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <button
                        type="button"
                        disabled={verificationLoading}
                        onClick={() => updateVerification(participant.id, "verified")}
                        className="rounded-full border border-emerald-500 px-3 py-1 text-emerald-600"
                      >
                        Verify
                      </button>
                      <button
                        type="button"
                        disabled={verificationLoading}
                        onClick={() => updateVerification(participant.id, "flagged")}
                        className="rounded-full border border-amber-500 px-3 py-1 text-amber-600"
                      >
                        Flag
                      </button>
                      <button
                        type="button"
                        disabled={verificationLoading}
                        onClick={() => updateVerification(participant.id, "rejected")}
                        className="rounded-full border border-rose-500 px-3 py-1 text-rose-600"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-slate-500">
              Showing the latest participants for this study. Verification updates sync to the ops dashboard.
            </p>
          </div>
        ) : (
          <p className="mt-4 text-xs text-slate-500">No participants loaded yet.</p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Segment summary</h2>
        <p className="mt-1 text-sm text-slate-600">Compare counts by participant segment.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <label className="text-sm text-slate-600">
            Study
            <select
              className="mt-1 w-full rounded-lg border border-slate-200 p-2"
              value={segmentStudyId}
              onChange={(event) => setSegmentStudyId(event.target.value)}
            >
              <option value="">Select study</option>
              {studyOptions.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <button
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
              onClick={loadSegmentSummary}
            >
              Load summary
            </button>
          </div>
        </div>
        {Object.keys(segmentSummary).length > 0 ? (
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {Object.entries(segmentSummary).map(([segment, count]) => (
              <div key={segment} className="rounded-xl border border-slate-200 p-4 text-sm text-slate-700">
                <div className="text-xs uppercase text-slate-500">{segment}</div>
                <div className="mt-1 text-2xl font-semibold text-slate-900">{count}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-xs text-slate-500">No segment data yet.</p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Localization readiness</h2>
        <p className="mt-1 text-sm text-slate-600">
          Track consent localization, recruitment messaging, and legal review before global launch.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm text-slate-600">
            Study
            <select
              className="mt-1 w-full rounded-lg border border-slate-200 p-2"
              value={localizationStudyId}
              onChange={(event) => setLocalizationStudyId(event.target.value)}
            >
              <option value="">Select study</option>
              {studyOptions.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {[
            { key: "consentLocalized", label: "Consent copy localized" },
            { key: "recruitmentCopyLocalized", label: "Recruitment copy localized" },
            { key: "moderatorAvailable", label: "Moderator language coverage confirmed" },
            { key: "incentivesLocalized", label: "Incentives and payout localized" },
            { key: "legalReviewed", label: "Legal and privacy review complete" },
          ].map((item) => (
            <label key={item.key} className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={!!localizationChecklist[item.key]}
                onChange={(event) =>
                  setLocalizationChecklist((prev) => ({ ...prev, [item.key]: event.target.checked }))
                }
              />
              {item.label}
            </label>
          ))}
        </div>
        <button
          className="mt-4 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
          onClick={saveLocalizationChecklist}
        >
          Save localization checklist
        </button>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Recruitment readiness</h2>
        <p className="mt-1 text-sm text-slate-600">
          Confirm segments, quotas, and fraud checks before recruitment launch.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm text-slate-600">
            Study
            <select
              className="mt-1 w-full rounded-lg border border-slate-200 p-2"
              value={recruitmentStudyId}
              onChange={(event) => setRecruitmentStudyId(event.target.value)}
            >
              <option value="">Select study</option>
              {studyOptions.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {[
            { key: "targetSegmentsDefined", label: "Target segments defined" },
            { key: "screeningQuestionsReady", label: "Screening questions ready" },
            { key: "sampleQuotaSet", label: "Sample quota set" },
            { key: "fraudChecksEnabled", label: "Fraud checks enabled" },
            { key: "incentivesApproved", label: "Incentives approved" },
          ].map((item) => (
            <label key={item.key} className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={!!recruitmentChecklist[item.key]}
                onChange={(event) =>
                  setRecruitmentChecklist((prev) => ({ ...prev, [item.key]: event.target.checked }))
                }
              />
              {item.label}
            </label>
          ))}
        </div>
        <button
          className="mt-4 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
          onClick={saveRecruitmentChecklist}
        >
          Save recruitment checklist
        </button>
        <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-800">Quota targets</h3>
          <p className="mt-1 text-xs text-slate-500">
            Set segment quotas in JSON and track progress against actuals.
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="text-sm text-slate-600">
              Study
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 p-2"
                value={quotaStudyId}
                onChange={(event) => setQuotaStudyId(event.target.value)}
              >
                <option value="">Select study</option>
                {studyOptions.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-slate-600">
              Quota targets JSON
              <textarea
                className="mt-1 h-28 w-full rounded-lg border border-slate-200 p-2 text-xs"
                value={quotaTargetsInput}
                onChange={(event) => setQuotaTargetsInput(event.target.value)}
              />
            </label>
          </div>
          <button
            className="mt-3 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
            onClick={saveQuotaTargets}
          >
            Save quotas
          </button>
          {quotaStatusMessage && <p className="mt-2 text-xs text-slate-500">{quotaStatusMessage}</p>}
          {quotaStatus.length > 0 && (
            <div className="mt-3 grid gap-2 text-xs text-slate-600 md:grid-cols-2">
              {quotaStatus.map((entry) => (
                <div key={entry.segment} className="rounded-lg border border-slate-200 bg-white p-2">
                  <div className="text-[11px] uppercase text-slate-400">{entry.segment}</div>
                  <div className="mt-1 text-sm font-semibold">
                    {entry.actual}/{entry.target}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Activation readiness</h2>
        <p className="mt-1 text-sm text-slate-600">
          Ensure distribution, evidence, and measurement plans are ready before sharing insights.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm text-slate-600">
            Study
            <select
              className="mt-1 w-full rounded-lg border border-slate-200 p-2"
              value={activationStudyId}
              onChange={(event) => setActivationStudyId(event.target.value)}
            >
              <option value="">Select study</option>
              {studyOptions.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {[
            { key: "executiveBriefReady", label: "Executive brief ready" },
            { key: "storyAssetsPackaged", label: "Story assets packaged" },
            { key: "stakeholderCommsPlanned", label: "Stakeholder comms planned" },
            { key: "evidenceBundleAttached", label: "Evidence bundle attached" },
            { key: "measurementPlanSet", label: "Measurement plan set" },
          ].map((item) => (
            <label key={item.key} className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={!!activationChecklist[item.key]}
                onChange={(event) =>
                  setActivationChecklist((prev) => ({ ...prev, [item.key]: event.target.checked }))
                }
              />
              {item.label}
            </label>
          ))}
        </div>
        <button
          className="mt-4 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
          onClick={saveActivationChecklist}
        >
          Save activation checklist
        </button>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Analysis quality</h2>
        <p className="mt-1 text-sm text-slate-600">
          Track evidence coverage and insight traceability before delivery.
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Evidence gaps will block insight set approvals until clips or transcript spans are attached.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm text-slate-600">
            Study
            <select
              className="mt-1 w-full rounded-lg border border-slate-200 p-2"
              value={analysisStudyId}
              onChange={(event) => setAnalysisStudyId(event.target.value)}
            >
              <option value="">Select study</option>
              {studyOptions.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </label>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700">
            <div className="text-xs uppercase text-slate-400">Coverage</div>
            <div className="mt-2 text-lg font-semibold">
              {analysisSummary?.evidenceCoverage
                ? `${Math.round((analysisSummary.evidenceCoverage.coverageRate ?? 0) * 100)}%`
                : "—"}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {analysisSummary?.evidenceCoverage
                ? `${analysisSummary.evidenceCoverage.insightsWithEvidence}/${analysisSummary.evidenceCoverage.totalInsights} insights linked`
                : "Select a study to view coverage"}
            </div>
          </div>
        </div>
        {analysisStatus && <p className="mt-3 text-xs text-slate-500">{analysisStatus}</p>}
        {analysisSummary?.evidenceCoverage && (
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-slate-200 p-3 text-sm text-slate-600">
              <div className="text-xs uppercase text-slate-400">Insights with evidence</div>
              <div className="mt-1 text-lg font-semibold">{analysisSummary.evidenceCoverage.insightsWithEvidence}</div>
            </div>
            <div className="rounded-lg border border-slate-200 p-3 text-sm text-slate-600">
              <div className="text-xs uppercase text-slate-400">Total insights</div>
              <div className="mt-1 text-lg font-semibold">{analysisSummary.evidenceCoverage.totalInsights}</div>
            </div>
            <div className="rounded-lg border border-slate-200 p-3 text-sm text-slate-600">
              <div className="text-xs uppercase text-slate-400">Clips per insight</div>
              <div className="mt-1 text-lg font-semibold">{analysisSummary.evidenceCoverage.clipsPerInsight}</div>
            </div>
          </div>
        )}
        {evidenceCoverage?.gapCount ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <div className="text-xs uppercase text-amber-600">Evidence gaps</div>
            <div className="mt-1 text-lg font-semibold">{evidenceCoverage.gapCount} insights missing evidence</div>
            <div className="mt-1 text-xs text-amber-700">
              Fix: add clips or transcript spans to each insight before approvals.
            </div>
            <ul className="mt-2 space-y-1 text-xs text-amber-700">
              {evidenceCoverage.gaps.slice(0, 4).map((gap) => (
                <li key={gap.insightId}>{gap.statement}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Rollout plan</h2>
        <p className="mt-1 text-sm text-slate-600">
          Track market rollout status for enterprise launches.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm text-slate-600">
            Study
            <select
              className="mt-1 w-full rounded-lg border border-slate-200 p-2"
              value={rolloutStudyId}
              onChange={(event) => setRolloutStudyId(event.target.value)}
            >
              <option value="">Select study</option>
              {studyOptions.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-600">
            Status
            <select
              className="mt-1 w-full rounded-lg border border-slate-200 p-2"
              value={rolloutStatus}
              onChange={(event) => setRolloutStatus(event.target.value)}
            >
              <option value="draft">Draft</option>
              <option value="piloting">Piloting</option>
              <option value="rolling_out">Rolling out</option>
              <option value="live">Live</option>
            </select>
          </label>
        </div>
        <label className="mt-4 block text-sm text-slate-600">
          Markets (comma-separated)
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 p-2"
            value={rolloutMarkets}
            onChange={(event) => setRolloutMarkets(event.target.value)}
            placeholder="US, UK, DE, AU"
          />
        </label>
        <button
          className="mt-4 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
          onClick={saveRolloutPlan}
        >
          Save rollout plan
        </button>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Distribution tracking</h2>
        <p className="mt-1 text-sm text-slate-600">
          Track channels and measurement signals after activation.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm text-slate-600">
            Study
            <select
              className="mt-1 w-full rounded-lg border border-slate-200 p-2"
              value={distributionStudyId}
              onChange={(event) => setDistributionStudyId(event.target.value)}
            >
              <option value="">Select study</option>
              {studyOptions.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="mt-4 block text-sm text-slate-600">
          Distribution channels (comma-separated)
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 p-2"
            value={distributionChannels}
            onChange={(event) => setDistributionChannels(event.target.value)}
            placeholder="Executive email, Slack, Town hall"
          />
        </label>
        <label className="mt-4 block text-sm text-slate-600">
          Measurement signals
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 p-2"
            value={distributionMeasurement}
            onChange={(event) => setDistributionMeasurement(event.target.value)}
            placeholder="Open rate, view time, decision logged"
          />
        </label>
        <button
          className="mt-4 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
          onClick={saveDistributionTracking}
        >
          Save distribution tracking
        </button>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Delivery health</h2>
        <p className="mt-1 text-sm text-slate-600">
          Track overall delivery health across readiness, rollout, and activation signals.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm text-slate-600">
            Study
            <select
              className="mt-1 w-full rounded-lg border border-slate-200 p-2"
              value={deliveryStudyId}
              onChange={(event) => setDeliveryStudyId(event.target.value)}
            >
              <option value="">Select study</option>
              {studyOptions.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-600">
            Status
            <select
              className="mt-1 w-full rounded-lg border border-slate-200 p-2"
              value={deliveryStatus}
              onChange={(event) => setDeliveryStatus(event.target.value)}
            >
              <option value="healthy">Healthy</option>
              <option value="watch">Watch</option>
              <option value="at_risk">At risk</option>
              <option value="unknown">Unknown</option>
            </select>
          </label>
        </div>
        <label className="mt-4 block text-sm text-slate-600">
          Health score
          <input
            type="number"
            min={0}
            max={100}
            className="mt-1 w-full rounded-lg border border-slate-200 p-2"
            value={deliveryScore}
            onChange={(event) => setDeliveryScore(Number(event.target.value))}
          />
        </label>
        <label className="mt-4 block text-sm text-slate-600">
          Notes
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 p-2"
            value={deliveryNotes}
            onChange={(event) => setDeliveryNotes(event.target.value)}
            placeholder="Explain the health signal or blockers"
          />
        </label>
        <button
          className="mt-4 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
          onClick={saveDeliveryHealth}
        >
          Save delivery health
        </button>
      </section>

      {statusMessage && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          {statusMessage}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Study Library</h2>
        {studies.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
            No studies yet. Create one above to start fieldwork.
          </div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {studies.map((study) => (
              <div key={study.id} className="rounded-xl border border-slate-200 p-4">
                <div className="text-sm font-semibold text-slate-900">{study.name}</div>
                <div className="mt-1 text-xs text-slate-500">ID: {study.id}</div>
                <div className="mt-2 text-sm text-slate-600">
                  Status: {study.status} · Language: {study.language} · Mode: {study.mode}
                </div>
                {study.interviewGuide && (
                  <div className="mt-2 text-xs text-slate-500">Interview guide ready.</div>
                )}
                {study.screeningLogic && (
                  <div className="text-xs text-slate-500">Screening logic configured.</div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
