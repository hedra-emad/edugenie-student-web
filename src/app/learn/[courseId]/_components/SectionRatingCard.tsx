"use client";
// _components/SectionRatingCard.tsx
//
// Compact, dismissible rating card reused both as the auto-triggered
// contextual prompt (PlayerLayout, below the video) and the manual
// "Rate this section" fallback (SectionAccordion). Owns its own fetch/submit
// via the existing reviews API — callers only decide WHEN to mount it.

import { useEffect, useState } from "react";
import { X, CheckCircle2 } from "lucide-react";
import StarRating from "@/components/ui/StarRating";
import Button from "@/components/ui/Button";
import { fetchSectionReviewStatus, submitReview } from "@/lib/api/reviews";

interface Props {
  courseId: string;
  sectionId: string;
  sectionTitle: string;
  onDismiss: () => void;
  /** Fired once the review is successfully saved (create or edit). */
  onSubmitted?: () => void;
}

export default function SectionRatingCard({
  courseId,
  sectionId,
  sectionTitle,
  onDismiss,
  onSubmitted,
}: Props) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [hasReviewed, setHasReviewed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchSectionReviewStatus(sectionId)
      .then((status) => {
        if (cancelled) return;
        setRating(status.rating ?? 0);
        setComment(status.comment ?? "");
        setHasReviewed(status.hasReviewed);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sectionId]);

  async function handleSubmit() {
    if (rating === 0 || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitReview({
        courseId,
        sectionId,
        rating,
        comment: comment.trim() || undefined,
      });
      setSubmitted(true);
      onSubmitted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-center gap-2.5">
        <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
        <p className="flex-1 text-[12.5px] font-medium text-emerald-800">
          Thanks for rating &ldquo;{sectionTitle}&rdquo;!
        </p>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="text-emerald-600 hover:text-emerald-800"
        >
          <X size={15} />
        </button>
      </div>
    );
  }

  const busy = loading || submitting;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-slate-800 leading-snug">
            {hasReviewed ? "Update your rating" : "How was this section?"}
          </p>
          <p className="text-[11.5px] text-slate-400 mt-0.5 truncate">
            {sectionTitle}
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <StarRating value={rating} onChange={setRating} readOnly={busy} />

      <input
        type="text"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Optional comment…"
        disabled={busy}
        className="
          w-full text-[12.5px] text-slate-700 placeholder:text-slate-400
          border border-slate-200 rounded-lg px-3 py-1.5
          focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400
          transition-colors duration-150 disabled:opacity-60
        "
      />

      {error && <p className="text-[11.5px] text-red-600">{error}</p>}

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onDismiss}>
          Maybe later
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          loading={submitting}
          disabled={rating === 0 || busy}
          onClick={handleSubmit}
        >
          {hasReviewed ? "Update" : "Submit"}
        </Button>
      </div>
    </div>
  );
}
