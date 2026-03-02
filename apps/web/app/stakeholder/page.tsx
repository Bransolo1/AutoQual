"use client";

import React, { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const HEADERS = { "x-workspace-id": "demo-workspace-id", "x-user-id": "demo-user" };

type ClientView = {
  projectId: string;
  name: string;
  status: string;
  overview?: string;
  milestones?: Array<{ id: string; name: string; status: string; dueDate: string }>;
  latestInsights?: Array<{ id: string; statement: string; confidenceScore: number }>;
};

type Story = {
  id: string;
  studyId: string;
  type: string;
  title: string;
  summary?: string | null;
};

export default function StakeholderPage() {
  const [projectId, setProjectId] = useState("");
  const [studyId, setStudyId] = useState("");
  const [clientView, setClientView] = useState<ClientView | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  const loadClientView = async () => {
    if (!projectId) return;
    const res = await fetch(`${API_BASE}/projects/${projectId}/client-view`, { headers: HEADERS });
    setClientView(res.ok ? await res.json() : null);
  };

  const loadStories = async () => {
    if (!studyId) return;
    const res = await fetch(`${API_BASE}/stories?studyId=${studyId}`, { headers: HEADERS });
    setStories(res.ok ? await res.json() : []);
  };

  useEffect(() => {
    if (!projectId) {
      setClientView(null);
      return;
    }
    loadClientView();
  }, [projectId]);

  useEffect(() => {
    if (!studyId) {
      setStories([]);
      return;
    }
    loadStories();
  }, [studyId]);

  return (
    <main className="min-h-screen px-8 py-10">
      <h1 className="text-2xl font-semibold">Stakeholder portal</h1>
      <p className="mt-2 text-sm text-gray-600">
        Read-only view of project status, approved insights, and stories.
      </p>

      <section className="mt-6 max-w-3xl rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Select project & study</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
            placeholder="Project ID"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <input
            value={studyId}
            onChange={(event) => setStudyId(event.target.value)}
            placeholder="Study ID"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
        {status && <p className="mt-3 text-xs text-gray-500">{status}</p>}
      </section>

      <section className="mt-6 max-w-3xl rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Project snapshot</h2>
        {!clientView ? (
          <p className="mt-3 text-sm text-gray-500">Enter a project ID to load the snapshot.</p>
        ) : (
          <div className="mt-3 space-y-3 text-sm text-gray-700">
            <div className="text-lg font-semibold">{clientView.name}</div>
            <div>Status: {clientView.status}</div>
            {clientView.overview && <div>{clientView.overview}</div>}
            {clientView.milestones?.length ? (
              <div className="rounded-lg border border-gray-100 p-3">
                <div className="text-xs uppercase text-gray-500">Milestones</div>
                <ul className="mt-2 space-y-1 text-xs text-gray-600">
                  {clientView.milestones.map((milestone) => (
                    <li key={milestone.id}>
                      {milestone.name} · {milestone.status}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {clientView.latestInsights?.length ? (
              <div className="rounded-lg border border-gray-100 p-3">
                <div className="text-xs uppercase text-gray-500">Latest insights</div>
                <ul className="mt-2 space-y-1 text-xs text-gray-600">
                  {clientView.latestInsights.map((insight) => (
                    <li key={insight.id}>{insight.statement}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}
      </section>

      <section className="mt-6 max-w-3xl rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Approved stories</h2>
        {stories.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">Enter a study ID to view stories.</p>
        ) : (
          <ul className="mt-3 space-y-3 text-sm text-gray-600">
            {stories.map((story) => (
              <li key={story.id} className="rounded-lg border border-gray-100 p-3">
                <div className="text-sm font-semibold text-gray-800">{story.title}</div>
                <div className="mt-1 text-xs text-gray-500">{story.type}</div>
                {story.summary && <div className="mt-2 text-xs text-gray-500">{story.summary}</div>}
                <div className="mt-2 flex flex-wrap gap-3 text-xs">
                  <a className="text-brand-600 hover:underline" href={`${API_BASE}/stories/${story.id}/markdown`}>
                    Markdown
                  </a>
                  <a className="text-brand-600 hover:underline" href={`${API_BASE}/stories/${story.id}/pdf`}>
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
