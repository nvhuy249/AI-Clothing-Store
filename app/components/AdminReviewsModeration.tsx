"use client";

import { useState } from "react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import type { ModerationReview, ReviewStatus } from "../lib/reviews";
import { RatingStars } from "./ProductReviews";

type Props = {
  initialReviews: ModerationReview[];
};

export default function AdminReviewsModeration({ initialReviews }: Props) {
  const [reviews, setReviews] = useState(initialReviews);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function moderate(reviewId: string, action: "approve" | "hide" | "unhide") {
    setWorkingId(reviewId);
    setError(null);

    try {
      const res = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-csrf-token": getCsrf() },
        body: JSON.stringify({ reviewId, action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Unable to update review");

      setReviews((current) =>
        current
          .map((review) => {
            const nextStatus: ReviewStatus = action === "hide" ? "hidden" : "published";
            return review.review_id === reviewId
              ? {
                  ...review,
                  is_flagged: action === "approve" ? false : review.is_flagged,
                  status: nextStatus,
                }
              : review;
          })
          .filter((review) => review.is_flagged || review.status === "hidden"),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update review");
    } finally {
      setWorkingId(null);
    }
  }

  if (reviews.length === 0) {
    return (
      <div className="rounded-[var(--radius-card)] border border-[color:var(--border-subtle)] bg-[color:var(--bg-panel)] p-6 text-sm text-[color:var(--text-muted)]">
        No flagged or hidden reviews need attention.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-rose-400">{error}</p>}
      {reviews.map((review) => (
        <article
          key={review.review_id}
          className="rounded-[var(--radius-card)] border border-[color:var(--border-subtle)] bg-[color:var(--bg-panel)] p-4"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <RatingStars rating={review.rating} size={16} />
                {review.is_flagged && (
                  <span className="rounded-full border border-amber-500/40 px-2 py-1 text-xs text-amber-300">
                    Flagged
                  </span>
                )}
                {review.status === "hidden" && (
                  <span className="rounded-full border border-rose-500/40 px-2 py-1 text-xs text-rose-300">
                    Hidden
                  </span>
                )}
              </div>
              <div>
                <h2 className="font-semibold text-[color:var(--text-primary)]">
                  {review.title || "Untitled review"}
                </h2>
                <p className="text-xs text-[color:var(--text-muted)]">
                  {review.product_name} - {review.customer_name} - {new Date(review.created_at).toLocaleDateString()}
                </p>
              </div>
              {review.fit_feedback && (
                <p className="inline-flex rounded-full border border-[color:var(--border-subtle)] px-2 py-1 text-xs text-[color:var(--accent-blue-soft)]">
                  {review.fit_feedback}
                </p>
              )}
              <p className="text-sm leading-6 text-[color:var(--text-muted)]">{review.body}</p>
            </div>
            <div className="flex flex-wrap gap-2 md:justify-end">
              <button
                type="button"
                disabled={workingId === review.review_id}
                onClick={() => moderate(review.review_id, "approve")}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
              >
                <ShieldCheck size={16} />
                Approve
              </button>
              {review.status === "hidden" ? (
                <button
                  type="button"
                  disabled={workingId === review.review_id}
                  onClick={() => moderate(review.review_id, "unhide")}
                  className="inline-flex items-center gap-2 rounded-lg border border-[color:var(--border-subtle)] px-3 py-2 text-sm text-[color:var(--text-primary)] hover:border-[color:var(--border-soft)] disabled:opacity-60"
                >
                  <Eye size={16} />
                  Unhide
                </button>
              ) : (
                <button
                  type="button"
                  disabled={workingId === review.review_id}
                  onClick={() => moderate(review.review_id, "hide")}
                  className="inline-flex items-center gap-2 rounded-lg border border-rose-500/50 px-3 py-2 text-sm text-rose-300 hover:bg-rose-950/30 disabled:opacity-60"
                >
                  <EyeOff size={16} />
                  Hide
                </button>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function getCsrf() {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/csrfToken=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}
