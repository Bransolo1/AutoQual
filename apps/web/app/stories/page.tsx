"use client";

import { useEffect, useState } from "react";
import { useApi } from "../lib/use-api";

type Story = {
  id: string;
  studyId: string;
  type: string;
  title: string;
  summary?: string | null;
  content: string;
  mediaUrl?: string | null;
};

type Study = { id: string; name: string };

const TYPE_META: Record<string, { label: string; icon: string; color: string }> = {
  article:  { label: "Article",    icon: "📄", color: "bg-blue-50 text-blue-700" },
  showreel: { label: "Showreel",   icon: "🎬", color: "bg-purple-50 text-purple-700" },
  podcast:  { label: "Podcast",    icon: "🎙️", color: "bg-amber-50 text-amber-700" },
  slide:    { label: "Slide deck", icon: "📊", color: "bg-green-50 text-green-700" },
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function StoriesPage() {
  const { apiFetch } = useApi();

  const [studies, setStudies] = useState<Study[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [studyId, setStudyId] = useState("");
  const [type, setType] = useState("article");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [creating, setCreating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("/studies")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Study[]) => setStudies(Array.isArray(data) ? data : []))
      .catch(() => undefined);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!studyId) { setStories([]); return; }
    apiFetch(`/stories?studyId=${studyId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Story[]) => setStories(Array.isArray(data) ? data : []))
      .catch(() => undefined);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studyId]);

  async function createStory() {
    if (!studyId || !title.trim() || !content.trim()) {
      setStatus({ kind: "err", msg: "Study, title, and content are required." });
      return;
    }
    setCreating(true);
    setStatus(null);
    const res = await apiFetch("/stories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studyId, type, title: title.trim(), summary: summary.trim() || undefined, content: content.trim() }),
    });
    if (res.ok) {
      setStatus({ kind: "ok", msg: "Story created." });
      setTitle(""); setSummary(""); setContent("");
      const fresh = await apiFetch(`/stories?studyId=${studyId}`);
      setStories(fresh.ok ? await fresh.json() : stories);
    } else {
      setStatus({ kind: "err", msg: "Failed to create story." });
    }
    setCreating(false);
  }

  async function generateStories() {
    if (!studyId) { setStatus({ kind: "err", msg: "Select a study first." }); return; }
    setGenerating(true);
    setStatus(null);
    const res = await apiFetch("/stories/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studyId }),
    });
    if (res.ok) {
      setStatus({ kind: "ok", msg: "Story set generated from insights." });
      const fresh = await apiFetch(`/stories?studyId=${studyId}`);
      setStories(fresh.ok ? await fresh.json() : stories);
    } else {
      setStatus({ kind: "err", msg: "Generation failed." });
    }
    setGenerating(false);
  }

  async function exportStory(storyId: string, exportType: "showreel" | "podcast" | "slide") {
    setExportStatus(`Preparing ${exportType}…`);
    const res = await apiFetch(`/stories/${storyId}/export/${exportType}`);
    if (!res.ok) { setExportStatus("Export failed."); return; }
    const payload = await res.json() as { url?: string };
    if (payload.url) { window.open(payload.url, "_blank"); setExportStatus(`${exportType} export ready.`); }
    else setExportStatus("Export ready.");
  }

  const selectedStudy = studies.find((s) => s.id === studyId);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-semibold text-slate-900">Stories</h1>
        <p className="mt-1 text-sm text-slate-500">
          Build evidence-backed narratives, showreels, and recap artifacts for stakeholders.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.5fr]">
          {/* Create panel */}
          <section className="rounded-2xl bg-white p-6 shadow-sm" aria-label="Create story">
            <h2 className="text-base font-semibold text-slate-900">Create story</h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1" htmlFor="story-study">Study</label>
                <select
                  id="story-study"
                  value={studyId}
                  onChange={(e) => setStudyId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                >
                  <option value="">Select a study…</option>
                  {studies.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <p className="block text-xs font-medium text-slate-500 mb-1" id="format-label">Format</p>
                <div className="grid grid-cols-2 gap-2" role="group" aria-labelledby="format-label">
                  {Object.entries(TYPE_META).map(([val, meta]) => (
                    <button
                      key={val}
                      type="button"
                      aria-pressed={type === val}
                      onClick={() => setType(val)}
                      className={`rounded-lg border-2 px-3 py-2 text-left text-xs transition-colors ${
                        type === val ? "border-slate-800 bg-slate-50" : "border-slate-200 hover:border-slate-400"
                      }`}
                    >
                      <span aria-hidden="true">{meta.icon}</span> {meta.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1" htmlFor="story-title">Title</label>
                <input
                  id="story-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Story title"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1" htmlFor="story-summary">
                  Summary <span className="text-slate-300">(optional)</span>
                </label>
                <input
                  id="story-summary"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="One-line summary for stakeholders"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1" htmlFor="story-content">Content</label>
                <textarea
                  id="story-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write or paste your story content…"
                  rows={6}
                  className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={createStory}
                disabled={creating || !studyId || !title.trim() || !content.trim()}
                className="w-full rounded-xl bg-slate-900 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-40"
              >
                {creating ? "Creating…" : "Create story"}
              </button>

              <button
                type="button"
                onClick={generateStories}
                disabled={generating || !studyId}
                className="w-full rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                {generating ? "Generating…" : "✨ Generate from insights"}
              </button>

              {status && (
                <p
                  role="status"
                  className={`rounded-lg px-3 py-2 text-xs ${
                    status.kind === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                  }`}
                >
                  {status.msg}
                </p>
              )}
            </div>
          </section>

          {/* Story library */}
          <section className="rounded-2xl bg-white p-6 shadow-sm" aria-label="Story library">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">
                Story library
                {selectedStudy && (
                  <span className="ml-2 text-sm font-normal text-slate-400">— {selectedStudy.name}</span>
                )}
              </h2>
              {stories.length > 0 && (
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                  {stories.length}
                </span>
              )}
            </div>

            {!studyId ? (
              <p className="mt-6 text-center text-sm text-slate-400">Select a study to view its stories.</p>
            ) : stories.length === 0 ? (
              <p className="mt-6 text-center text-sm text-slate-400">
                No stories yet. Create one or generate from insights.
              </p>
            ) : (
              <ul className="mt-4 space-y-4" aria-label="Stories list">
                {stories.map((story) => {
                  const meta = TYPE_META[story.type] ?? { label: story.type, icon: "📄", color: "bg-slate-100 text-slate-600" };
                  return (
                    <li key={story.id} className="rounded-xl border border-slate-100 p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${meta.color}`}>
                            <span aria-hidden="true">{meta.icon}</span> {meta.label}
                          </span>
                          <p className="mt-1 text-sm font-semibold text-slate-800">{story.title}</p>
                          {story.summary && (
                            <p className="mt-0.5 text-xs text-slate-500">{story.summary}</p>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-50 pt-3">
                        <a
                          href={`${API_BASE}/stories/${story.id}/markdown`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Download ${story.title} as Markdown`}
                          className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50"
                        >
                          Markdown
                        </a>
                        <a
                          href={`${API_BASE}/stories/${story.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Download ${story.title} as PDF`}
                          className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50"
                        >
                          PDF
                        </a>
                        {(["showreel", "podcast", "slide"] as const).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => exportStory(story.id, t)}
                            aria-label={`Export ${story.title} as ${TYPE_META[t].label}`}
                            className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50"
                          >
                            <span aria-hidden="true">{TYPE_META[t].icon}</span> {TYPE_META[t].label}
                          </button>
                        ))}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {exportStatus && (
              <p role="status" className="mt-3 text-xs text-slate-500">{exportStatus}</p>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
