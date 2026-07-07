// _components/CourseReviews.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { Section } from "../../../app/courses/[courseId]/types/course";
import { useCourseAccess } from "./CourseAccessProvider";
import StarRating from "@/components/ui/StarRating";
import Button from "@/components/ui/Button";
import { fetchSectionReviewStatus, submitReview } from "@/lib/api/reviews";

interface SectionReviewState {
  rating: number;
  comment: string;
  hasReviewed: boolean;
  loading: boolean;
  submitting: boolean;
  error: string | null;
  justSubmitted: boolean;
}

const EMPTY_STATE: SectionReviewState = {
  rating: 0,
  comment: "",
  hasReviewed: false,
  loading: true,
  submitting: false,
  error: null,
  justSubmitted: false,
};

interface Props {
  sections: Section[];
  courseId: string;
}

export default function CourseReviews({ sections, courseId }: Props) {
  const access = useCourseAccess();

  const ownedSections = useMemo(
    () =>
      sections.filter(
        (s) => access.isFullyOwned || access.ownedSectionIds.has(s.id),
      ),
    [sections, access.isFullyOwned, access.ownedSectionIds],
  );
  const ownedIdsKey = ownedSections.map((s) => s.id).join(",");

  const [reviews, setReviews] = useState<Record<string, SectionReviewState>>({});

  useEffect(() => {
    if (!ownedIdsKey) return;
    const ids = ownedIdsKey.split(",");
    let cancelled = false;

    ids.forEach((id) => {
      fetchSectionReviewStatus(id)
        .then((status) => {
          if (cancelled) return;
          setReviews((prev) => ({
            ...prev,
            [id]: {
              ...(prev[id] ?? EMPTY_STATE),
              rating: status.rating ?? 0,
              comment: status.comment ?? "",
              hasReviewed: status.hasReviewed,
              loading: false,
            },
          }));
        })
        .catch(() => {
          if (cancelled) return;
          setReviews((prev) => ({
            ...prev,
            [id]: { ...(prev[id] ?? EMPTY_STATE), loading: false },
          }));
        });
    });

    return () => {
      cancelled = true;
    };
  }, [ownedIdsKey]);

  function updateSection(id: string, updates: Partial<SectionReviewState>) {
    setReviews((prev) => ({ ...prev, [id]: { ...prev[id], ...updates } }));
  }

  async function handleSubmit(id: string) {
    const state = reviews[id];
    if (!state || state.rating === 0 || state.submitting) return;

    updateSection(id, { submitting: true, error: null, justSubmitted: false });

    try {
      await submitReview({
        courseId,
        sectionId: id,
        rating: state.rating,
        comment: state.comment.trim() || undefined,
      });
      updateSection(id, { submitting: false, hasReviewed: true, justSubmitted: true });
      setTimeout(() => updateSection(id, { justSubmitted: false }), 3000);
    } catch (err) {
      updateSection(id, {
        submitting: false,
        error: err instanceof Error ? err.message : "Failed to submit review",
      });
    }
  }

  // Same gating as purchase-gated UI elsewhere on the page: nothing to rate
  // until access resolves, and nothing to show if nothing was purchased.
  if (access.loading || !access.hasAnyAccess || ownedSections.length === 0) {
    return null;
  }

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-6">
      <h2 className="text-[15px] font-bold text-slate-900 mb-1">
        Rate the sections you own
      </h2>
      <p className="text-[12.5px] text-slate-400 mb-5">
        Your section ratings power this course&apos;s overall rating.
      </p>

      <div className="flex flex-col gap-2">
        {ownedSections.map((section) => {
          const state = reviews[section.id] ?? EMPTY_STATE;
          const busy = state.loading || state.submitting;

          return (
            <div
              key={section.id}
              className="border border-slate-200 rounded-xl px-4 py-3 flex flex-col gap-2.5"
            >
              <div className="flex items-center gap-3 flex-wrap">
                <p className="flex-1 min-w-[160px] text-[13.5px] font-semibold text-slate-800 leading-tight flex items-center gap-1.5">
                  {section.title}
                  {state.hasReviewed && (
                    <span
                      className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex-shrink-0"
                      title="You reviewed this section"
                    >
                      <svg
                        className="w-2.5 h-2.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  )}
                </p>

                <StarRating
                  value={state.rating}
                  onChange={(v) => updateSection(section.id, { rating: v })}
                  readOnly={busy}
                />

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  loading={state.submitting}
                  disabled={state.rating === 0 || busy}
                  onClick={() => handleSubmit(section.id)}
                >
                  {state.hasReviewed ? "Update" : "Submit"}
                </Button>

                {state.justSubmitted && (
                  <span className="text-[11.5px] font-semibold text-emerald-600">
                    Saved
                  </span>
                )}
              </div>

              <input
                type="text"
                value={state.comment}
                onChange={(e) => updateSection(section.id, { comment: e.target.value })}
                placeholder="Optional comment…"
                disabled={busy}
                className="
                  w-full text-[12.5px] text-slate-700 placeholder:text-slate-400
                  border border-slate-200 rounded-lg px-3 py-1.5
                  focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400
                  transition-colors duration-150 disabled:opacity-60
                "
              />

              {state.error && (
                <p className="text-[11.5px] text-red-600">{state.error}</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
