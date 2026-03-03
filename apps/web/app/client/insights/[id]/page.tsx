"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useApi } from "../../../lib/use-api";

type Insight = {
  id: string;
  statement: string;
  status: string;
  confidenceScore: number;
  businessImplication: string;
  tags: string[];
  supportingTranscriptSpans?: string[];
  supportingVideoClips?: string[];
};

export default function ClientInsightPage() {
  const { apiFetch, user } = useApi();
  const params = useParams();
  const id = params?.id as string | undefined;
  const [insight, setInsight] = useState<Insight | null>(null);

  useEffect(() => {
    if (!id) return;
    apiFetch(`/insights/${id}`))
      .then((r) => (r.ok ? r.json() : null))
      .then(setInsight);
  }, [id]);

  if (!insight) {
    return <main className="p-8">Loading…</main>;
  }

  return (
    <main className="min-h-screen px-8 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Insight Detail</h1>
        <Link href="/client" className="text-brand-600 hover:underline">
          Back to portal
        </Link>
      </div>
      <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">{insight.statement}</h2>
        <p className="mt-2 text-sm text-gray-600">Status: {insight.status}</p>
        <p className="mt-3 text-sm text-gray-700">{insight.businessImplication}</p>
        <div className="mt-4 text-xs text-gray-500">
          Confidence: {insight.confidenceScore} · Tags: {insight.tags.join(", ")}
        </div>
      </section>

      {insight.supportingTranscriptSpans?.length ? (
        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Transcript evidence</h2>
          <ul className="mt-3 space-y-2 text-sm text-gray-700">
            {insight.supportingTranscriptSpans.map((span, index) => (
              <li key={`${span}-${index}`} className="rounded-lg border border-gray-100 p-3">
                “{span}”
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
