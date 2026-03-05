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

type CommentEntry = {
  id: string;
  body: string;
  authorUserId: string;
  createdAt?: string;
};

type Review = {
  id: string;
  status: string;
  reviewerId?: string | null;
  commentEntries: CommentEntry[];
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

function initials(userId: string) {
  return userId.slice(0, 2).toUpperCase();
}

function formatDate(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

const STATUS_BADGE: Record<string, string> = {
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  requested: "bg-amber-100 text-amber-700",
  draft: "bg-slate-100 text-slate-600",
};

export default function InsightDetailPage() {
  const { apiFetch, user } = useApi();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id as string | undefined;
  const [insight, setInsight] = useState<Insight | null>(null);
  const [reviewerId, setReviewerId] = useState("");
  const [comment, setComment] = useState("");
  const [posting, setPosting] = useState(false);
  const role = searchParams?.get("role") ?? "researcher";

  useEffect(() => {
    if (!id) return;
    apiFetch(`/insights/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setInsight);
  }, [id]);

  const latestVersions = useMemo(() => {
    if (!insight?.versions?.length) return { current: null, previous: null };
    const sorted = [...insight.versions].sort((a, b) => b.versionNumber - a.versionNumber);
    return { current: sorted[0], previous: sorted[1] ?? null };
  }, [insight]);

  const refreshInsight = async () => {
    const res = await apiFetch(`/insights/${id}`);
    setInsight(res.ok ? await res.json() : null);
  };

  if (!insight) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-4 border-slate-200 border-t-slate-700" />
      </main>
    );
  }

  const currentStatement = String(latestVersions.current?.content?.statement ?? insight.statement);
  const prevStatement = String(latestVersions.previous?.content?.statement ?? "");
  const diff = diffText(prevStatement, currentStatement);
  const primaryReview = insight.reviews[0];
  const allComments = insight.reviews.flatMap((r) => r.commentEntries);

  const updateReviewStatus = async (status: string) => {
    if (!primaryReview || role === "client") return;
    await apiFetch(`/reviews/${primaryReview.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
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
    if (!primaryReview || !reviewerId || role === "client") return;
    await apiFetch(`/reviews/${primaryReview.id}/assign`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reviewerId,
        workspaceId: user?.workspaceId ?? "",
        actorUserId: user?.sub ?? "",
      }),
    });
    await refreshInsight();
  };

  const addComment = async () => {
    if (!primaryReview || !comment.trim() || role === "client") return;
    setPosting(true);
    await apiFetch(`/reviews/${primaryReview.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authorUserId: user?.sub ?? "", body: comment.trim() }),
    });
    setComment("");
    setPosting(false);
    await refreshInsight();
  };

  const reviewStatus = primaryReview?.status ?? insight.status;
  const statusBadgeClass = STATUS_BADGE[reviewStatus] ?? "bg-slate-100 text-slate-600";

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Insight Review</h1>
            <div className="mt-2 flex items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusBadgeClass}`}>
                {reviewStatus}
              </span>
              {role === "client" && (
                <span className="text-xs text-slate-400">Read-only view</span>
              )}
            </div>
          </div>
          {primaryReview && role !== "client" && (
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => updateReviewStatus("approved")}
                className="rounded-full bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => updateReviewStatus("rejected")}
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Reject
              </button>
            </div>
          )}
          {!primaryReview && <p className="text-sm text-slate-400">No review assigned yet.</p>}
        </div>

        {/* Export gate banner */}
        {reviewStatus === "requested" && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <strong>Export blocked</strong> — this insight must be approved before it can be
            exported or included in a story.
          </div>
        )}

        {/* Statement */}
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Statement</h2>
          <p className="mt-3 text-base text-slate-800 leading-relaxed">{currentStatement}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {insight.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
                {tag}
              </span>
            ))}
          </div>
          <p className="mt-3 text-sm text-slate-500">
            <span className="font-medium text-slate-700">Business implication:</span>{" "}
            {insight.businessImplication}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Confidence: {Math.round(insight.confidenceScore * 100)}%
          </p>
        </section>

        {/* Version diff */}
        {(diff.added.length > 0 || diff.removed.length > 0) && (
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Changes (latest vs previous version)
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-slate-500">Added</p>
                <p className="mt-1 text-sm text-green-700">{diff.added.join(" ") || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Removed</p>
                <p className="mt-1 text-sm text-red-700">{diff.removed.join(" ") || "—"}</p>
              </div>
            </div>
          </section>
        )}

        {/* Assign reviewer */}
        {primaryReview && role !== "client" && (
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Reviewer assignment
            </h2>
            <div className="mt-3 flex gap-3">
              <input
                value={reviewerId}
                onChange={(e) => setReviewerId(e.target.value)}
                placeholder="Reviewer user ID"
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={assignReviewer}
                disabled={!reviewerId.trim()}
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                Assign
              </button>
            </div>
            {primaryReview.reviewerId && (
              <p className="mt-2 text-xs text-slate-400">
                Currently assigned to: <span className="font-medium">{primaryReview.reviewerId}</span>
              </p>
            )}
          </section>
        )}

        {/* Comments */}
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Review comments
            {allComments.length > 0 && (
              <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                {allComments.length}
              </span>
            )}
          </h2>

          {allComments.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">No comments yet.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {allComments.map((c) => (
                <li key={c.id} className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
                    {initials(c.authorUserId)}
                  </div>
                  <div className="flex-1 rounded-xl bg-slate-50 px-4 py-3">
                    <p className="text-sm text-slate-800">{c.body}</p>
                    <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-400">
                      <span className="font-medium">{c.authorUserId}</span>
                      {c.createdAt && <span>·</span>}
                      {c.createdAt && <span>{formatDate(c.createdAt)}</span>}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {primaryReview && role !== "client" && (
            <div className="mt-5 flex gap-3">
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    addComment();
                  }
                }}
                placeholder="Add a comment…"
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-slate-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={addComment}
                disabled={!comment.trim() || posting}
                className="rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-40"
              >
                {posting ? "Posting…" : "Post"}
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
