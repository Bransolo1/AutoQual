"use client";

import React, { useEffect, useMemo, useState } from "react";
import { API_BASE, HEADERS } from "@/lib/api";
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

type EvidenceSnippet = {
  spanId: string;
  transcriptId?: string;
  startMs?: number;
  endMs?: number;
  text?: string;
};

type SearchEvidenceResult = {
  id: string;
  statement: string;
  transcriptSnippets?: EvidenceSnippet[];
};

type EvidenceFormState = {
  transcriptInput: string;
  clipInput: string;
  status?: string | null;
};

type SpanBuilderState = {
  transcriptId: string;
  startMs: string;
  endMs: string;
  status?: string | null;
  preview?: string | null;
  spans?: Array<{ id: string; startMs: number; endMs: number; text?: string | null }>;
};

type UnredactState = {
  transcriptId: string;
  reason: string;
  status?: string | null;
  content?: string | null;
  redactedContent?: string | null;
};

const defaultEvidenceState: EvidenceFormState = {
  transcriptInput: "",
  clipInput: "",
  status: null,
};

const defaultSpanState: SpanBuilderState = {
  transcriptId: "",
  startMs: "",
  endMs: "",
  status: null,
  preview: null,
  spans: [],
};

const defaultUnredactState: UnredactState = {
  transcriptId: "",
  reason: "",
  status: null,
  content: null,
  redactedContent: null,
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
  const [segments, setSegments] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadStatus, setLoadStatus] = useState<string | null>(null);
  const [evidenceState, setEvidenceState] = useState<Record<string, EvidenceFormState>>({});
  const [spanState, setSpanState] = useState<Record<string, SpanBuilderState>>({});
  const [unredactState, setUnredactState] = useState<UnredactState>(defaultUnredactState);
  const [searchResults, setSearchResults] = useState<SearchEvidenceResult[]>([]);
  const [searchStatus, setSearchStatus] = useState<string | null>(null);

  const fetchInsights = async () => {
    if (!studyId) {
      setInsights([]);
      setSearchResults([]);
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
      setSegments([]);
      return;
    }
    const res = await fetch(`${API_BASE}/themes?studyId=${studyId}`, { headers: HEADERS });
    if (!res.ok) return;
    setThemes(await res.json());
    const segmentsRes = await fetch(`${API_BASE}/themes/segments?studyId=${studyId}`, { headers: HEADERS });
    if (segmentsRes.ok) {
      const payload = (await segmentsRes.json()) as { segments?: string[] };
      setSegments(payload.segments ?? []);
    }
  };

  const searchEvidence = async () => {
    if (!studyId || !searchQuery.trim()) {
      setSearchResults([]);
      setSearchStatus("Provide a study ID and search query.");
      return;
    }
    setSearchStatus("Searching...");
    const res = await fetch(`${API_BASE}/search/insights/query-evidence`, {
      method: "POST",
      headers: { ...HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({ query: searchQuery, studyId, limit: 8 }),
    });
    if (!res.ok) {
      setSearchStatus("Search failed.");
      return;
    }
    const payload = (await res.json()) as { evidence?: SearchEvidenceResult[] };
    const evidence = Array.isArray(payload.evidence) ? payload.evidence : [];
    setSearchResults(evidence);
    setSearchStatus(evidence.length ? null : "No evidence matches.");
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
      if (segmentFilter !== "all" && segmentFilter.trim()) {
        const segmentTagMatch = insight.tags.some(
          (tag) =>
            tag.toLowerCase() === `segment:${segmentFilter.toLowerCase()}` ||
            tag.toLowerCase() === `segment=${segmentFilter.toLowerCase()}`,
        );
        if (!segmentTagMatch) return false;
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

  const updateSpanState = (insightId: string, patch: Partial<SpanBuilderState>) => {
    setSpanState((prev) => ({
      ...prev,
      [insightId]: { ...defaultSpanState, ...prev[insightId], ...patch },
    }));
  };

  const updateUnredactState = (patch: Partial<UnredactState>) => {
    setUnredactState((prev) => ({ ...prev, ...patch }));
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

  const createTranscriptSpan = async (insightId: string) => {
    const state = spanState[insightId] ?? defaultSpanState;
    if (!state.transcriptId.trim()) {
      updateSpanState(insightId, { status: "Transcript ID required." });
      return;
    }
    const startMs = Number(state.startMs);
    const endMs = Number(state.endMs);
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
      updateSpanState(insightId, { status: "Provide a valid start/end range." });
      return;
    }
    updateSpanState(insightId, { status: "Creating span..." });
    const res = await fetch(`${API_BASE}/transcripts/${state.transcriptId}/spans`, {
      method: "POST",
      headers: { ...HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({ startMs, endMs }),
    });
    if (!res.ok) {
      updateSpanState(insightId, { status: "Failed to create span." });
      return;
    }
    const payload = (await res.json()) as { id?: string; text?: string };
    if (!payload.id) {
      updateSpanState(insightId, { status: "Span created without id." });
      return;
    }
    const evidence = evidenceState[insightId] ?? defaultEvidenceState;
    const existing = parseEvidenceInput(evidence.transcriptInput);
    const next = [...new Set([...existing, payload.id])];
    updateEvidenceState(insightId, { transcriptInput: next.join(", ") });
    updateSpanState(insightId, {
      status: "Span created.",
      preview: payload.text ?? null,
      spans: [{ id: payload.id, startMs, endMs, text: payload.text ?? null }, ...(state.spans ?? [])],
    });
  };

  const loadTranscriptSpans = async (insightId: string) => {
    const state = spanState[insightId] ?? defaultSpanState;
    if (!state.transcriptId.trim()) {
      updateSpanState(insightId, { status: "Transcript ID required." });
      return;
    }
    updateSpanState(insightId, { status: "Loading spans..." });
    const res = await fetch(`${API_BASE}/transcripts/${state.transcriptId}/spans`, {
      headers: HEADERS,
    });
    if (!res.ok) {
      updateSpanState(insightId, { status: "Failed to load spans." });
      return;
    }
    const spans = (await res.json()) as Array<{
      id: string;
      startMs: number;
      endMs: number;
      text?: string | null;
    }>;
    updateSpanState(insightId, {
      status: spans.length ? `Loaded ${spans.length} span(s).` : "No spans found.",
      spans,
    });
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

  const requestUnredact = async () => {
    if (!unredactState.transcriptId.trim()) {
      updateUnredactState({ status: "Transcript ID required." });
      return;
    }
    updateUnredactState({ status: "Requesting unredact..." });
    const res = await fetch(`${API_BASE}/transcripts/${unredactState.transcriptId}/unredact`, {
      method: "POST",
      headers: { ...HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({
        actorUserId: "demo-user",
        reason: unredactState.reason || undefined,
      }),
    });
    if (!res.ok) {
      updateUnredactState({ status: "Unredact request failed." });
      return;
    }
    const payload = (await res.json()) as { content?: string; redactedContent?: string };
    updateUnredactState({
      status: "Unredact granted.",
      content: payload.content ?? null,
      redactedContent: payload.redactedContent ?? null,
    });
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
          <select
            value={segmentFilter}
            onChange={(event) => setSegmentFilter(event.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="all">All segments</option>
            {segments.map((segment) => (
              <option key={segment} value={segment}>
                {segment}
              </option>
            ))}
          </select>
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
              const span = spanState[insight.id] ?? defaultSpanState;
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

                  <div className="mt-4 rounded-lg border border-gray-100 bg-white p-3">
                    <div className="text-xs uppercase text-gray-400">Transcript span builder</div>
                    <div className="mt-2 grid gap-2 md:grid-cols-3">
                      <label className="text-xs text-gray-500">
                        Transcript ID
                        <input
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs"
                          value={span.transcriptId}
                          onChange={(event) =>
                            updateSpanState(insight.id, { transcriptId: event.target.value })
                          }
                          placeholder="transcript-id"
                        />
                      </label>
                      <label className="text-xs text-gray-500">
                        Start ms
                        <input
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs"
                          value={span.startMs}
                          onChange={(event) =>
                            updateSpanState(insight.id, { startMs: event.target.value })
                          }
                          placeholder="0"
                        />
                      </label>
                      <label className="text-xs text-gray-500">
                        End ms
                        <input
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs"
                          value={span.endMs}
                          onChange={(event) =>
                            updateSpanState(insight.id, { endMs: event.target.value })
                          }
                          placeholder="25000"
                        />
                      </label>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => createTranscriptSpan(insight.id)}
                        className="rounded-full border border-gray-200 px-3 py-1 text-gray-600"
                      >
                        Create span
                      </button>
                      <button
                        type="button"
                        onClick={() => loadTranscriptSpans(insight.id)}
                        className="rounded-full border border-gray-200 px-3 py-1 text-gray-600"
                      >
                        Load spans
                      </button>
                      {span.status && <span className="text-xs text-gray-500">{span.status}</span>}
                    </div>
                    {span.preview && (
                      <p className="mt-2 text-xs text-gray-500">Preview: {span.preview}</p>
                    )}
                    {span.spans && span.spans.length > 0 && (
                      <ul className="mt-3 space-y-2 text-xs text-gray-500">
                        {span.spans.map((entry) => (
                          <li key={entry.id} className="rounded-md border border-gray-100 p-2">
                            <div className="font-medium text-gray-700">{entry.id}</div>
                            <div className="mt-1">
                              {entry.startMs}ms → {entry.endMs}ms
                            </div>
                            {entry.text && <div className="mt-1">{entry.text}</div>}
                            <button
                              type="button"
                              onClick={() => {
                                const current = evidenceState[insight.id] ?? defaultEvidenceState;
                                const existing = parseEvidenceInput(current.transcriptInput);
                                const next = [...new Set([...existing, entry.id])];
                                updateEvidenceState(insight.id, { transcriptInput: next.join(", ") });
                              }}
                              className="mt-2 rounded-full border border-gray-200 px-3 py-1 text-gray-600"
                            >
                              Add to evidence
                            </button>
                          </li>
                        ))}
                      </ul>
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

      <section className="mt-6 max-w-4xl rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Evidence search</h2>
        <p className="mt-2 text-xs text-gray-500">
          Search insights and see evidence snippets with jump-to-span actions.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <button
            type="button"
            onClick={searchEvidence}
            className="rounded-full border border-brand-500 px-3 py-1 font-medium text-brand-600"
          >
            Search evidence
          </button>
          {searchStatus && <span className="text-xs text-gray-500">{searchStatus}</span>}
        </div>
        {searchResults.length > 0 && (
          <ul className="mt-4 space-y-3 text-xs text-gray-600">
            {searchResults.map((result) => (
              <li key={result.id} className="rounded-xl border border-gray-100 p-4">
                <div className="text-sm font-semibold text-gray-800">{result.statement}</div>
                {result.transcriptSnippets && result.transcriptSnippets.length > 0 ? (
                  <ul className="mt-2 space-y-2">
                    {result.transcriptSnippets.map((snippet) => (
                      <li key={snippet.spanId} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                        <div className="text-xs text-gray-400">
                          Span {snippet.spanId}
                          {snippet.transcriptId ? ` · Transcript ${snippet.transcriptId}` : ""}
                        </div>
                        <div className="mt-1 text-xs text-gray-600">
                          {typeof snippet.startMs === "number" && typeof snippet.endMs === "number"
                            ? `${snippet.startMs}ms → ${snippet.endMs}ms`
                            : "Timing unavailable"}
                        </div>
                        {snippet.text && <p className="mt-2 text-xs text-gray-500">{snippet.text}</p>}
                        {snippet.transcriptId && typeof snippet.startMs === "number" && typeof snippet.endMs === "number" && (
                          <button
                            type="button"
                            onClick={() => {
                              updateSpanState(result.id, {
                                transcriptId: snippet.transcriptId ?? "",
                                startMs: String(snippet.startMs ?? ""),
                                endMs: String(snippet.endMs ?? ""),
                                status: "Loaded from search result.",
                              });
                            }}
                            className="mt-2 rounded-full border border-gray-200 px-3 py-1 text-gray-600"
                          >
                            Jump to span
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs text-gray-500">No evidence snippets available.</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 max-w-4xl rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Reviewer unredact</h2>
        <p className="mt-2 text-xs text-gray-500">
          Request full transcript content with an audit trail. Admin role required.
        </p>
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          <label className="text-xs text-gray-500">
            Transcript ID
            <input
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs"
              value={unredactState.transcriptId}
              onChange={(event) => updateUnredactState({ transcriptId: event.target.value })}
              placeholder="transcript-id"
            />
          </label>
          <label className="text-xs text-gray-500">
            Reason (optional)
            <input
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs"
              value={unredactState.reason}
              onChange={(event) => updateUnredactState({ reason: event.target.value })}
              placeholder="QA review"
            />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={requestUnredact}
            className="rounded-full border border-gray-200 px-3 py-1 text-gray-600"
          >
            Request unredact
          </button>
          {unredactState.status && <span className="text-xs text-gray-500">{unredactState.status}</span>}
        </div>
        {(unredactState.redactedContent || unredactState.content) && (
          <div className="mt-4 grid gap-3 text-xs text-gray-500 md:grid-cols-2">
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
              <div className="text-xs uppercase text-gray-400">Redacted</div>
              <p className="mt-2 whitespace-pre-wrap">{unredactState.redactedContent}</p>
            </div>
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
              <div className="text-xs uppercase text-gray-400">Full content</div>
              <p className="mt-2 whitespace-pre-wrap">{unredactState.content}</p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
