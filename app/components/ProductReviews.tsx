"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Flag, Star } from "lucide-react";
import type { ProductReview, ReviewSummary } from "../lib/reviews";

type Props = {
  productId: string;
  authed: boolean;
  reviews: ProductReview[];
  summary: ReviewSummary;
  myReview: ProductReview | null;
};

const fitOptions = ["True to size", "Runs small", "Runs large", "Relaxed fit", "Slim fit"];

export function RatingStars({ rating, size = 18 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          size={size}
          className={value <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-slate-600"}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

export default function ProductReviews({ productId, authed, reviews, summary, myReview }: Props) {
  const router = useRouter();
  const [rating, setRating] = useState(myReview?.rating ?? 5);
  const [title, setTitle] = useState(myReview?.title ?? "");
  const [body, setBody] = useState(myReview?.body ?? "");
  const [fitFeedback, setFitFeedback] = useState(myReview?.fit_feedback ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flaggingId, setFlaggingId] = useState<string | null>(null);

  const sortedRatingRows = useMemo(() => [5, 4, 3, 2, 1] as const, []);

  async function submitReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": getCsrf() },
        body: JSON.stringify({
          productId,
          rating,
          title: title || null,
          body,
          fitFeedback: fitFeedback || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Review could not be saved");
      setMessage("Review saved.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Review could not be saved");
    } finally {
      setSaving(false);
    }
  }

  async function flagReview(reviewId: string) {
    setFlaggingId(reviewId);
    setError(null);
    try {
      const res = await fetch(`/api/reviews/${reviewId}/flag`, {
        method: "PATCH",
        headers: { "x-csrf-token": getCsrf() },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Review could not be flagged");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Review could not be flagged");
    } finally {
      setFlaggingId(null);
    }
  }

  return (
    <section className="max-w-6xl mx-auto mt-12 space-y-6" id="reviews">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase text-[color:var(--accent-blue-soft)]">Customer reviews</p>
          <h2 className="text-2xl font-semibold text-[color:var(--text-primary)]">Fit notes and ratings</h2>
        </div>
        <div className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[color:var(--border-subtle)] bg-[color:var(--bg-panel)] px-4 py-3">
          <RatingStars rating={summary.averageRating ?? 0} />
          <div>
            <p className="text-sm font-semibold text-[color:var(--text-primary)]">
              {summary.averageRating ? summary.averageRating.toFixed(1) : "No rating"}
            </p>
            <p className="text-xs text-[color:var(--text-muted)]">
              {summary.reviewCount} {summary.reviewCount === 1 ? "review" : "reviews"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
        <div className="space-y-4 rounded-[var(--radius-card)] border border-[color:var(--border-subtle)] bg-[color:var(--bg-panel)] p-4">
          {sortedRatingRows.map((value) => {
            const count = summary.ratingCounts[value];
            const width = summary.reviewCount > 0 ? Math.round((count / summary.reviewCount) * 100) : 0;
            return (
              <div key={value} className="grid grid-cols-[44px_1fr_32px] items-center gap-3 text-sm">
                <span className="text-[color:var(--text-primary)]">{value} star</span>
                <div className="h-2 overflow-hidden rounded-full bg-[color:var(--bg-base)]">
                  <div className="h-full rounded-full bg-amber-400" style={{ width: `${width}%` }} />
                </div>
                <span className="text-right text-[color:var(--text-muted)]">{count}</span>
              </div>
            );
          })}
        </div>

        <form
          onSubmit={submitReview}
          className="space-y-4 rounded-[var(--radius-card)] border border-[color:var(--border-subtle)] bg-[color:var(--bg-panel)] p-4"
        >
          <div>
            <h3 className="font-semibold text-[color:var(--text-primary)]">
              {myReview ? "Update your review" : "Write a review"}
            </h3>
            <p className="text-sm text-[color:var(--text-muted)]">
              Reviews are public once submitted. Flagged reviews are hidden until moderated.
            </p>
          </div>

          {!authed ? (
            <p className="rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--bg-base)] p-3 text-sm text-[color:var(--text-muted)]">
              Sign in to leave a product review.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    className="rounded-lg p-1 text-amber-400 hover:bg-[color:var(--bg-base)]"
                    aria-label={`${value} stars`}
                  >
                    <Star size={24} className={value <= rating ? "fill-amber-400" : "text-slate-600"} />
                  </button>
                ))}
              </div>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={120}
                className="w-full rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--bg-base)] px-3 py-2 text-sm text-[color:var(--text-primary)]"
                placeholder="Review title"
              />
              <select
                value={fitFeedback}
                onChange={(event) => setFitFeedback(event.target.value)}
                className="w-full rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--bg-base)] px-3 py-2 text-sm text-[color:var(--text-primary)]"
              >
                <option value="">Fit feedback</option>
                {fitOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                required
                minLength={10}
                maxLength={1500}
                rows={4}
                className="w-full rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--bg-base)] px-3 py-2 text-sm text-[color:var(--text-primary)]"
                placeholder="How did the product fit, feel, and look in person?"
              />
              {error && <p className="text-sm text-rose-400">{error}</p>}
              {message && <p className="text-sm text-emerald-300">{message}</p>}
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-[color:var(--accent-blue)] px-4 py-2 text-sm font-semibold text-[color:var(--bg-base)] hover:brightness-110 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Submit review"}
              </button>
            </>
          )}
        </form>
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-[color:var(--border-subtle)] bg-[color:var(--bg-panel)] p-5 text-sm text-[color:var(--text-muted)]">
          No published reviews yet.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {reviews.map((review) => (
            <article
              key={review.review_id}
              className="rounded-[var(--radius-card)] border border-[color:var(--border-subtle)] bg-[color:var(--bg-panel)] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <RatingStars rating={review.rating} size={16} />
                  <h3 className="mt-2 font-semibold text-[color:var(--text-primary)]">
                    {review.title || "Product review"}
                  </h3>
                  <p className="text-xs text-[color:var(--text-muted)]">
                    {review.customer_name} on {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => flagReview(review.review_id)}
                  disabled={flaggingId === review.review_id}
                  className="inline-flex items-center gap-1 rounded-lg border border-[color:var(--border-subtle)] px-2 py-1 text-xs text-[color:var(--text-muted)] hover:border-amber-400 hover:text-amber-300 disabled:opacity-60"
                >
                  <Flag size={13} />
                  {flaggingId === review.review_id ? "Flagging" : "Flag"}
                </button>
              </div>
              {review.fit_feedback && (
                <p className="mt-3 inline-flex rounded-full border border-[color:var(--border-subtle)] px-2 py-1 text-xs text-[color:var(--accent-blue-soft)]">
                  {review.fit_feedback}
                </p>
              )}
              <p className="mt-3 text-sm leading-6 text-[color:var(--text-muted)]">{review.body}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function getCsrf() {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/csrfToken=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}
