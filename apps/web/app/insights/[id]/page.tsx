"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useApi } from "../../lib/use-api";

type InsightVersion = {
  id: string;
  versionNumber: number;
  content: Record<string, unknown>;
  createdAt: string;
};

type Review = {
  id: string;
  status: string;
  reviewerId?: string | null;
  commentEntries: { id: string; body: string; authorUserId: string }[];
};

type Insight = {
  id: string;
  statement: string;
  status: string;
  confidenceScore: number;
  businessImplication: string;
  tags: string[];
  versions: InsightVersion[];
  reviews: Review[];
};

function diffText(a: string, b: string) {
  if (!a || !b) return { added: [], removed: [] };
  const aSet = new Set(a.split(" "));
  const bSet = new Set(b.split(" "));
  const added = [...bSet].filter((w) => !aSet.has(w));
  const removed = [...aSet].filter((w) => !bSet.has(w));
  return { added, removed };
}

export default function InsightDetailPage() {
  const { apiFetch, user } = useApi();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id as string | undefined;
  const [insight, setInsight] = useState<Insight | null>(null);
  const [reviewerId, setReviewerId] = useState("");
  const [comment, setComment] = useState("");
  const role = searchParams?.get("role") ?? "researcher";
  useEffect(() => {
    if (!id) return;
    apiFetch(`/insights/${id}`))
      .then((r) => (r.ok ? r.json() : null))
      .then(setInsight);
  }, [id]);

  const latestVersions = useMemo(() => {
    if (!insight?.versions?.length) return { current: null, previous: null };
    const sorted = [...insight.versions].sort((a, b) => b.versionNumber - a.versionNumber);
    return { current: sorted[0], previous: sorted[1] ?? null };
  }, [insight]);

  const refreshInsight = async () => {
    const res = await apiFetch(`/insights/${id}`));
    setInsight(res.ok ? await res.json() : null);
  };

  if (!insight) return <main className="p-8">Loading…</main>;

  const currentStatement = String(latestVersions.current?.content?.statement ?? insight.statement);
  const prevStatement = String(latestVersions.previous?.content?.statement ?? "");
  const diff = diffText(prevStatement, currentStatement);
  const primaryReview = insight.reviews[0];

  const updateReviewStatus = async (status: string) => {
    if (!primaryReview) return;
    if (role === "client") return;
    await apiFetch(`/reviews/${primaryReview.id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...HEADERS,
      },
      body: JSON.stringify({
        status,
        reviewerId: "demo-reviewer",
        workspaceId: user?.workspaceId ?? "",
        actorUserId: user?.sub ?? "",
      }),
    });
    await refreshInsight();
  };
  const assignReviewer = async () => {
    if (!primaryReview || !reviewerId) return;
    if (role === "client") return;
    await apiFetch(`/reviews/${primaryReview.id}/assign`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...HEADERS },
      body: JSON.stringify({
        reviewerId,
        workspaceId: user?.workspaceId ?? "",
        actorUserId: user?.sub ?? "",
      }),
    });
    await refreshInsight();
  };
  const addComment = async () => {
    if (!primaryReview || !comment.trim()) return;
    if (role === "client") return;
    await apiFetch(`/reviews/${primaryReview.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...HEADERS },
      body: JSON.stringify({ authorUserId: user?.sub ?? "", body: comment.trim() }),
    });
    setComment("");
    await refreshInsight();
  };

  return (
    <main className="min-h-screen px-8 py-10">
      <h1 className="text-2xl font-semibold">Insight Review</h1>
      <p className="mt-2 text-sm text-gray-600">Status: {insight.status}</p>
      {primaryReview ? (
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={() => updateReviewStatus("approved")}
            className="rounded-full bg-green-600 px-4 py-2 text-sm font-medium text-white"
          >
            Approve
          </button>
          <button
            type="button"
            onClick={() => updateReviewStatus("rejected")}
            className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white"
          >
            Reject
          </button>
        </div>
      ) : (
        <p className="mt-4 text-sm text-gray-500">No review assigned yet.</p>
      )}
      {role === "client" && (
        <p className="mt-2 text-xs text-gray-500">Client role is read-only.</p>
      )}
      {primaryReview && role !== "client" && (
        <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex gap-3">
            <input
              value={reviewerId}
              onChange={(e) => setReviewerId(e.target.value)}
              placeholder="Reviewer ID"
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={assignReviewer}
              className="rounded-full border border-brand-500 px-4 py-2 text-sm font-medium text-brand-600"
            >
              Assign reviewer
            </button>
          </div>
        </div>
      )}

      <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Current statement</h2>
        <p className="mt-2 text-sm text-gray-700">{currentStatement}</p>
        <div className="mt-4 text-xs text-gray-500">
          Confidence: {insight.confidenceScore} · Tags: {insight.tags.join(", ")}
        </div>
        <p className="mt-3 text-sm text-gray-600">Business implication: {insight.businessImplication}</p>
      </section>

      <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Version diff (latest vs previous)</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Added words</h3>
            <p className="mt-2 text-sm text-green-700">{diff.added.join(" ") || "—"}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Removed words</h3>
            <p className="mt-2 text-sm text-red-700">{diff.removed.join(" ") || "—"}</p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Review comments</h2>
        <div className="mt-3 space-y-3">
          {insight.reviews.flatMap((r) => r.commentEntries).map((c) => (
            <div key={c.id} className="rounded-lg border border-gray-100 p-3 text-sm">
              <p>{c.body}</p>
              <p className="mt-1 text-xs text-gray-500">By {c.authorUserId}</p>
            </div>
          ))}
        </div>
        {primaryReview && role !== "client" && (
          <div className="mt-4 flex gap-3">
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add review comment"
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={addComment}
              className="rounded-full border border-brand-500 px-4 py-2 text-sm font-medium text-brand-600"
            >
              Post
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
