function getBaseUrl(): string {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_API_URL ?? "";
  }
  return process.env.NEXT_PUBLIC_API_BASE ?? "/api/proxy";
}

export interface SectionReviewStatus {
  hasReviewed: boolean;
  rating: number | null;
  comment: string | null;
}

/** The current student's existing review (if any) for one section. */
export async function fetchSectionReviewStatus(
  sectionId: string,
): Promise<SectionReviewStatus> {
  const res = await fetch(`${getBaseUrl()}/reviews/section/${sectionId}`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) return { hasReviewed: false, rating: null, comment: null };
  const json = await res.json();
  const data = json?.data ?? json;
  return {
    hasReviewed: Boolean(data?.hasReviewed),
    rating: typeof data?.rating === "number" ? data.rating : null,
    comment: typeof data?.comment === "string" ? data.comment : null,
  };
}

export interface SubmitReviewPayload {
  courseId: string;
  sectionId: string;
  rating: number;
  comment?: string;
}

/** Creates or updates the student's review for one section. */
export async function submitReview(
  payload: SubmitReviewPayload,
): Promise<void> {
  const res = await fetch(`${getBaseUrl()}/reviews`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(
      (error as { message?: string }).message ?? "Failed to submit review",
    );
  }
}
