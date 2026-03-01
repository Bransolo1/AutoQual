"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const HEADERS = { "x-workspace-id": "demo-workspace-id", "x-user-id": "demo-user" };

type Insight = {
  id: string;
  statement: string;
  status: string;
  confidenceScore: number;
};

type InsightTemplate = {
  id: string;
  title: string;
  fields: string[];
};

export default function InsightsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialStudyId = useMemo(() => searchParams.get("studyId") ?? "demo-study-id", [searchParams]);
  const reviewId = searchParams.get("reviewId");
  const [insights, setInsights] = useState<Insight[]>([]);
  const [templates, setTemplates] = useState<InsightTemplate[]>([]);
  const [studyId, setStudyId] = useState(initialStudyId);

  useEffect(() => {
    fetch(`${API_BASE}/insights?studyId=${studyId}`, { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : []))
      .then(setInsights);
  }, [studyId]);

  useEffect(() => {
    fetch(`${API_BASE}/insights/templates`, { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : []))
      .then(setTemplates);
  }, []);

  useEffect(() => {
    if (!reviewId) return;
    fetch(`${API_BASE}/reviews/${reviewId}`, { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : null))
      .then((review) => {
        if (review?.insightId) {
          router.push(`/insights/${review.insightId}`);
        }
      });
  }, [reviewId, router]);

  return (
    <main className="min-h-screen px-8 py-10">
      <h1 className="text-2xl font-semibold">Insights</h1>
      <p className="mt-2 text-sm text-gray-600">Review insight versions and approvals.</p>
      <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-gray-500">Templates</p>
        <div className="mt-3 flex flex-wrap gap-2 text-sm text-gray-700">
          {templates.map((template) => (
            <span key={template.id} className="rounded-full bg-gray-100 px-3 py-1">
              {template.title}: {template.fields.join(", ")}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
        <input
          value={studyId}
          onChange={(event) => setStudyId(event.target.value)}
          placeholder="Study ID"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
      </div>
      <div className="mt-6 grid gap-4">
        {insights.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-sm text-gray-500">
            No insights yet. Generate insights from transcripts to populate this view.
          </div>
        ) : (
          insights.map((insight) => (
            <Link
              key={insight.id}
              href={`/insights/${insight.id}`}
              className="rounded-2xl bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{insight.statement}</h2>
                <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700">
                  {insight.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-500">Confidence: {insight.confidenceScore}</p>
            </Link>
          ))
        )}
      </div>
    </main>
  );
}
