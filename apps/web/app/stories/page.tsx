\"use client\";

import React, { useEffect, useState } from \"react\";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? \"http://localhost:4000\";
const HEADERS = { \"x-workspace-id\": \"demo-workspace-id\", \"x-user-id\": \"demo-user\" };

type Story = {
  id: string;
  studyId: string;
  type: string;
  title: string;
  summary?: string | null;
  content: string;
  mediaUrl?: string | null;
};

export default function StoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [studyId, setStudyId] = useState(\"\");
  const [type, setType] = useState(\"article\");
  const [title, setTitle] = useState(\"\");
  const [summary, setSummary] = useState(\"\");
  const [content, setContent] = useState(\"\");
  const [status, setStatus] = useState<string | null>(null);

  const loadStories = async () => {
    const res = await fetch(`${API_BASE}/stories?studyId=${studyId}`, { headers: HEADERS });
    if (!res.ok) return;
    setStories(await res.json());
  };

  useEffect(() => {
    if (!studyId) {
      setStories([]);
      return;
    }
    loadStories();
  }, [studyId]);

  const createStory = async () => {
    if (!studyId || !title.trim() || !content.trim()) {
      setStatus(\"Study, title, and content are required.\");
      return;
    }
    const res = await fetch(`${API_BASE}/stories`, {
      method: \"POST\",
      headers: { ...HEADERS, \"Content-Type\": \"application/json\" },
      body: JSON.stringify({
        studyId,
        type,
        title: title.trim(),
        summary: summary.trim() || undefined,
        content: content.trim(),
      }),
    });
    if (!res.ok) {
      setStatus(\"Failed to create story.\");
      return;
    }
    setStatus(\"Story created.\");
    setTitle(\"\");
    setSummary(\"\");
    setContent(\"\");
    await loadStories();
  };

  return (
    <main className=\"min-h-screen px-8 py-10\">
      <h1 className=\"text-2xl font-semibold\">Stories</h1>
      <p className=\"mt-2 text-sm text-gray-600\">
        Build evidence-backed stories, showreels, and recap artifacts for stakeholders.
      </p>

      <section className=\"mt-6 max-w-2xl rounded-2xl bg-white p-6 shadow-sm\">
        <h2 className=\"text-lg font-semibold\">Create story</h2>
        <div className=\"mt-4 grid gap-3\">
          <input
            value={studyId}
            onChange={(event) => setStudyId(event.target.value)}
            placeholder=\"Study ID\"
            className=\"rounded-lg border border-gray-200 px-3 py-2 text-sm\"
          />
          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
            className=\"rounded-lg border border-gray-200 px-3 py-2 text-sm\"
          >
            <option value=\"article\">Article</option>
            <option value=\"showreel\">Showreel</option>
            <option value=\"podcast\">Podcast</option>
          </select>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder=\"Story title\"
            className=\"rounded-lg border border-gray-200 px-3 py-2 text-sm\"
          />
          <input
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            placeholder=\"Summary (optional)\"
            className=\"rounded-lg border border-gray-200 px-3 py-2 text-sm\"
          />
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder=\"Story content\"
            rows={5}
            className=\"rounded-lg border border-gray-200 px-3 py-2 text-sm\"
          />
          <button
            type=\"button\"
            onClick={createStory}
            className=\"rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white\"
          >
            Create story
          </button>
          {status && <p className=\"text-xs text-gray-500\">{status}</p>}
        </div>
      </section>

      <section className=\"mt-8 max-w-2xl rounded-2xl bg-white p-6 shadow-sm\">
        <h2 className=\"text-lg font-semibold\">Story library</h2>
        {stories.length === 0 ? (
          <p className=\"mt-3 text-sm text-gray-500\">No stories yet. Select a study to view.</p>
        ) : (
          <ul className=\"mt-4 space-y-3 text-sm text-gray-600\">
            {stories.map((story) => (
              <li key={story.id} className=\"rounded-lg border border-gray-100 p-3\">
                <div className=\"text-sm font-semibold text-gray-800\">{story.title}</div>
                <div className=\"mt-1 text-xs text-gray-500\">
                  {story.type} · Study {story.studyId}
                </div>
                {story.summary && <div className=\"mt-2 text-xs text-gray-500\">{story.summary}</div>}
                <div className=\"mt-2 flex flex-wrap gap-3 text-xs\">
                  <a
                    className=\"text-brand-600 hover:underline\"
                    href={`${API_BASE}/stories/${story.id}/markdown`}
                  >
                    Markdown
                  </a>
                  <a
                    className=\"text-brand-600 hover:underline\"
                    href={`${API_BASE}/stories/${story.id}/pdf`}
                  >
                    PDF
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
