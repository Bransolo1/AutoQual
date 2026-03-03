"use client";

import { useState } from "react";
import Link from "next/link";
import { useApi } from "../lib/use-api";

type SearchResult = {
  id?: string;
  statement?: string;
  tags?: string[];
  studyId?: string;
  confidenceScore?: number;
};

export default function SearchPage() {
  const { apiFetch, user } = useApi();
  const [query, setQuery] = useState("");
  const [studyId, setStudyId] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  const runSearch = async () => {
    if (!query.trim()) return;
    setStatus("Searching...");
    const res = await apiFetch(`/search/insights/query`, {
      method: "POST",
      headers: { ...HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({ query, studyId: studyId || undefined, limit: 20 }),
    });
    if (!res.ok) {
      setStatus("Search failed.");
      return;
    }
    const data = await res.json();
    setResults(data.results ?? []);
    setStatus(`Found ${data.results?.length ?? 0} results.`);
  };

  return (
    <main className="min-h-screen px-8 py-10">
      <h1 className="text-2xl font-semibold">Insight Search</h1>
      <p className="mt-2 text-sm text-gray-600">Search insights across studies and tags.</p>

      <div className="mt-4 flex flex-wrap gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search statements or tags"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm md:w-80"
        />
        <input
          value={studyId}
          onChange={(event) => setStudyId(event.target.value)}
          placeholder="Study ID (optional)"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm md:w-64"
        />
        <button
          type="button"
          onClick={runSearch}
          className="rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white"
        >
          Search
        </button>
        {status && <span className="self-center text-xs text-gray-500">{status}</span>}
      </div>

      <div className="mt-6 grid gap-4">
        {results.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-sm text-gray-500">
            No results yet. Run a search to see matching insights.
          </div>
        ) : (
          results.map((result) => (
            <div key={result.id ?? result.statement} className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{result.statement ?? "Insight"}</h2>
                {typeof result.confidenceScore === "number" && (
                  <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700">
                    Confidence {result.confidenceScore}
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs text-gray-500">Study ID: {result.studyId ?? "n/a"}</p>
              {result.tags && result.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {result.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              {result.id && (
                <Link href={`/insights/${result.id}`} className="mt-3 inline-block text-xs text-brand-600 hover:underline">
                  View insight →
                </Link>
              )}
            </div>
          ))
        )}
      </div>
    </main>
  );
}
