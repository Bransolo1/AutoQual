"use client";

import React, { useEffect, useState } from "react";
import { API_BASE, HEADERS } from "@/lib/api";

type Review = {
  id: string;
  insightId: string;
  status: string;
  reviewerId?: string | null;
  comments?: string | null;
  commentEntries?: Array<{ id: string; authorUserId: string; body: string; createdAt: string }>;
};

export default function ReviewsPage() {
  const [studyId, setStudyId] = useState("");
  const [status, setStatus] = useState("in_review");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadStatus, setLoadStatus] = useState<string | null>(null);

  const loadReviews = async () => {
    if (!studyId) return;
    setLoadStatus("Loading reviews...");
    const params = new URLSearchParams({ studyId, status });
    const res = await fetch(`${API_BASE}/reviews?${params.toString()}`, { headers: HEADERS });
    if (!res.ok) {
      setLoadStatus("Failed to load reviews.");
      return;
    }
    setReviews(await res.json());
    setLoadStatus(null);
  };

  useEffect(() => {
    if (!studyId) {
      setReviews([]);
      return;
    }
    loadReviews();
  }, [studyId, status]);

  return (
    <main className="min-h-screen px-8 py-10">
      <h1 className="text-2xl font-semibold">Review Queue</h1>
      <p className="mt-2 text-sm text-gray-600">
        Track insights waiting for review and approval before delivery.
      </p>

      <section className="mt-6 max-w-3xl rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Filters</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            value={studyId}
            onChange={(event) => setStudyId(event.target.value)}
            placeholder="Study ID"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="draft">Draft</option>
            <option value="in_review">In review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        {loadStatus && <p className="mt-3 text-xs text-gray-500">{loadStatus}</p>}
      </section>

      <section className="mt-6 max-w-3xl rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Reviews</h2>
        {reviews.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">No reviews for this study/status.</p>
        ) : (
          <ul className="mt-4 space-y-3 text-sm text-gray-600">
            {reviews.map((review) => (
              <li key={review.id} className="rounded-lg border border-gray-100 p-3">
                <div className="text-sm font-semibold text-gray-800">Insight {review.insightId}</div>
                <div className="mt-1 text-xs text-gray-500">
                  Status: {review.status} · Reviewer {review.reviewerId ?? "unassigned"}
                </div>
                {review.comments && (
                  <div className="mt-2 text-xs text-gray-500">Notes: {review.comments}</div>
                )}
                {review.commentEntries?.length ? (
                  <ul className="mt-2 space-y-1 text-xs text-gray-500">
                    {review.commentEntries.slice(0, 3).map((entry) => (
                      <li key={entry.id}>
                        {entry.authorUserId}: {entry.body}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
