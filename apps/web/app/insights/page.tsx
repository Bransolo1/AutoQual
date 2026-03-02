"use client";

import React, { useEffect, useMemo, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const HEADERS = { "x-workspace-id": "demo-workspace-id", "x-user-id": "demo-user" };
const STORY_DRAFT_KEY = "autoqual.storyDraft.v1";

type Insight = {
  id: string;
  studyId: string;
  statement: string;
  supportingTranscriptSpans: string[];
  supportingVideoClips: string[];
  confidenceScore: number;
  businessImplication: string;
  tags: string[];
  status: string;
};

type Theme = { id: string; label: string };

type EvidenceFormState = {
  transcriptInput: string;
  clipInput: string;
  status?: string | null;
};

const defaultEvidenceState: EvidenceFormState = {
  transcriptInput: "",
  clipInput: "",
  status: null,
};

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item));
}

function parseEvidenceInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed);
      return toStringArray(parsed);
    } catch {
      return [];
    }
  }
  return trimmed
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function InsightWorkbenchPage() {
  const [studyId, setStudyId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [themeFilter, setThemeFilter] = useState("all");
  const [segmentFilter, setSegmentFilter] = useState("");
  const [minConfidence, setMinConfidence] = useState(0.2);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadStatus, setLoadStatus] = useState<string | null>(null);
  const [evidenceState, setEvidenceState] = useState<Record<string, EvidenceFormState>>({});

  const fetchInsights = async () => {
    if (!studyId) {
      setInsights([]);
      return;
    }
    setLoading(true);
    setLoadStatus("Loading insights...");
    const res = await fetch(`${API_BASE}/insights?studyId=${studyId}`, { headers: HEADERS });
    if (!res.ok) {
      setLoadStatus("Failed to load insights.");
      setLoading(false);
      return;
    }
    const payload = (await res.json()) as Insight[];
    setInsights(
      payload.map((insight) => ({
        ...insight,
        supportingTranscriptSpans: toStringArray(insight.supportingTranscriptSpans),
        supportingVideoClips: toStringArray(insight.supportingVideoClips),
        tags: toStringArray(insight.tags),
      })),
    );
    setLoadStatus(null);
    setLoading(false);
  };

  const fetchThemes = async () => {
    if (!studyId) {
      setThemes([]);
      return;
    }
    const res = await fetch(`${API_BASE}/themes?studyId=${studyId}`, { headers: HEADERS });
    if (!res.ok) return;
    setThemes(await res.json());
  };

  useEffect(() => {
    fetchInsights();
    fetchThemes();
  }, [studyId]);

  const filteredInsights = useMemo(() => {
    return insights.filter((insight) => {
      if (statusFilter !== "all" && insight.status !== statusFilter) return false;
      if (themeFilter !== "all" && !insight.tags.includes(themeFilter)) return false;
      if (insight.confidenceScore < minConfidence) return false;
      if (searchQuery.trim()) {
        const haystack = `${insight.statement} ${insight.businessImplication} ${insight.tags.join(" ")}`.toLowerCase();
        if (!haystack.includes(searchQuery.toLowerCase())) return false;
      }
      if (segmentFilter.trim()) {
        const haystack = `${insight.statement} ${insight.tags.join(" ")} ${insight.supportingTranscriptSpans.join(" ")}`.toLowerCase();
        if (!haystack.includes(segmentFilter.toLowerCase())) return false;
      }
      return true;
    });
  }, [insights, minConfidence, searchQuery, segmentFilter, statusFilter, themeFilter]);

  const updateEvidenceState = (insightId: string, patch: Partial<EvidenceFormState>) => {
    setEvidenceState((prev) => ({
      ...prev,
      [insightId]: { ...defaultEvidenceState, ...prev[insightId], ...patch },
    }));
  };

  const addEvidence = async (insightId: string) => {
    const state = evidenceState[insightId] ?? defaultEvidenceState;
    const transcriptSpans = parseEvidenceInput(state.transcriptInput);
    const videoClips = parseEvidenceInput(state.clipInput);
    updateEvidenceState(insightId, { status: "Saving evidence..." });
    const res = await fetch(`${API_BASE}/insights/${insightId}/evidence`, {
      method: "POST",
      headers: { ...HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({
        supportingTranscriptSpans: transcriptSpans.length ? transcriptSpans : undefined,
        supportingVideoClips: videoClips.length ? videoClips : undefined,
      }),
    });
    if (!res.ok) {
      updateEvidenceState(insightId, { status: "Failed to add evidence." });
      return;
    }
    updateEvidenceState(insightId, { status: "Evidence added." });
    await fetchInsights();
  };

  const addToStoryDraft = (insight: Insight) => {
    const existing = localStorage.getItem(STORY_DRAFT_KEY);
    const blocks = existing ? (JSON.parse(existing) as Array<Record<string, unknown>>) : [];
    const next = [
      ...blocks,
      {
        type: "insight",
        statement: insight.statement,
        businessImplication: insight.businessImplication,
        evidence: {
          transcriptSpans: insight.supportingTranscriptSpans,
          videoClips: insight.supportingVideoClips,
        },
      },
    ];
    localStorage.setItem(STORY_DRAFT_KEY, JSON.stringify(next));
    updateEvidenceState(insight.id, { status: "Added to story draft." });
  };

  return (
    <main className="min-h-screen px-8 py-10">
      <h1 className="text-2xl font-semibold">Insight workbench</h1>
      <p className="mt-2 text-sm text-gray-600">
        Evidence-first insight review with theme filters and attachment tooling.
      </p>

      <section className="mt-6 max-w-4xl rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Filters</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <input
            value={studyId}
            onChange={(event) => setStudyId(event.target.value)}
            placeholder="Study ID"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search statement or implication"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <input
            value={segmentFilter}
            onChange={(event) => setSegmentFilter(event.target.value)}
            placeholder="Segment (tag or text match)"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <select
            value={themeFilter}
            onChange={(event) => setThemeFilter(event.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="all">All themes</option>
            {themes.map((theme) => (
              <option key={theme.id} value={theme.label}>
                {theme.label}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="in_review">In review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <label className="text-xs text-gray-500">
            Min confidence
            <input
              type="number"
              min={0}
              max={1}
              step={0.05}
              value={minConfidence}
              onChange={(event) => setMinConfidence(Number(event.target.value))}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <button
            type="button"
            onClick={fetchInsights}
            className="rounded-full border border-brand-500 px-3 py-1 font-medium text-brand-600"
          >
            Refresh insights
          </button>
          <button
            type="button"
            onClick={fetchThemes}
            className="rounded-full border border-gray-200 px-3 py-1 text-gray-600"
          >
            Refresh themes
          </button>
          {loadStatus && <span className="text-xs text-gray-500">{loadStatus}</span>}
        </div>
      </section>

      <section className="mt-6 max-w-4xl rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Insights</h2>
        {loading ? (
          <p className="mt-3 text-sm text-gray-500">Loading insights…</p>
        ) : filteredInsights.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">No insights match these filters.</p>
        ) : (
          <ul className="mt-4 space-y-4 text-sm text-gray-600">
            {filteredInsights.map((insight) => {
              const evidence = evidenceState[insight.id] ?? defaultEvidenceState;
              const hasEvidence =
                insight.supportingTranscriptSpans.length > 0 ||
                insight.supportingVideoClips.length > 0;
              return (
                <li key={insight.id} className="rounded-xl border border-gray-100 p-4">
                  <div className="text-sm font-semibold text-gray-800">{insight.statement}</div>
                  <div className="mt-1 text-xs text-gray-500">
                    Status {insight.status} · Confidence {insight.confidenceScore.toFixed(2)}
                  </div>
                  <p className="mt-2 text-xs text-gray-500">{insight.businessImplication}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                    {insight.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-gray-100 px-2 py-0.5">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-3">
                    <div className="text-xs uppercase text-gray-400">Evidence</div>
                    {hasEvidence ? (
                      <div className="mt-2 grid gap-2 text-xs text-gray-500 md:grid-cols-2">
                        <div>
                          <div className="text-xs uppercase text-gray-400">Transcript spans</div>
                          {insight.supportingTranscriptSpans.length ? (
                            <ul className="mt-1 space-y-1">
                              {insight.supportingTranscriptSpans.map((span, index) => (
                                <li key={`${insight.id}-span-${index}`}>{span}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="mt-1">No transcript spans yet.</p>
                          )}
                        </div>
                        <div>
                          <div className="text-xs uppercase text-gray-400">Video clips</div>
                          {insight.supportingVideoClips.length ? (
                            <ul className="mt-1 space-y-1">
                              {insight.supportingVideoClips.map((clip, index) => (
                                <li key={`${insight.id}-clip-${index}`}>{clip}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="mt-1">No video clips yet.</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-gray-500">
                        No evidence attached yet. Add transcript spans or clip IDs below.
                      </p>
                    )}
                  </div>

                  <div className="mt-4 grid gap-2 md:grid-cols-2">
                    <label className="text-xs text-gray-500">
                      Transcript spans (comma list or JSON array)
                      <input
                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs"
                        value={evidence.transcriptInput}
                        onChange={(event) =>
                          updateEvidenceState(insight.id, { transcriptInput: event.target.value })
                        }
                        placeholder="span-id-1, span-id-2"
                      />
                    </label>
                    <label className="text-xs text-gray-500">
                      Video clip IDs (comma list or JSON array)
                      <input
                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs"
                        value={evidence.clipInput}
                        onChange={(event) =>
                          updateEvidenceState(insight.id, { clipInput: event.target.value })
                        }
                        placeholder="clip-id-1, clip-id-2"
                      />
                    </label>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => addEvidence(insight.id)}
                      className="rounded-full border border-brand-500 px-3 py-1 font-medium text-brand-600"
                    >
                      Attach evidence
                    </button>
                    <button
                      type="button"
                      onClick={() => addToStoryDraft(insight)}
                      className="rounded-full border border-gray-200 px-3 py-1 text-gray-600"
                    >
                      Add to story draft
                    </button>
                    <a className="rounded-full border border-gray-200 px-3 py-1 text-gray-600" href="/stories">
                      Open story builder
                    </a>
                    {evidence.status && <span className="text-xs text-gray-500">{evidence.status}</span>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
