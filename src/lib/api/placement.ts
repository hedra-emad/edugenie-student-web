// Client-side API for the AI pre-purchase placement test. All calls go through
// the same-origin proxy, which attaches the JWT httpOnly cookie.

const BASE = "/api/proxy";

export interface PlacementQuestion {
  id: string;
  questionText: string;
  type: string;
  options: string[];
}

export interface PlacementGenSection {
  sectionId: string;
  title: string;
  questions: PlacementQuestion[];
}

export interface PlacementTest {
  attemptId: string;
  courseId: string;
  courseTitle: string;
  sections: PlacementGenSection[];
}

export interface PlacementResultRow {
  sectionId: string;
  title: string;
  price: number | null;
  score: number; // 0–100
  correct: number;
  total: number;
  mastered: boolean;
}

export type PlacementMode = "sections" | "full" | "none";

export interface PlacementRecommendation {
  courseId: string;
  mode: PlacementMode;
  message: string;
  coursePrice: number;
  totalPrice: number;
  savings: number;
  sections: { sectionId: string; title: string; price: number | null }[];
  results: PlacementResultRow[];
}

export interface PlacementAnswer {
  questionId: string;
  selected: string[];
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const m = (data as { message?: unknown }).message;
    throw new Error(
      Array.isArray(m)
        ? m.join(", ")
        : typeof m === "string"
          ? m
          : "Something went wrong. Please try again.",
    );
  }
  return res.json() as Promise<T>;
}

export function generatePlacement(courseId: string): Promise<PlacementTest> {
  return post<PlacementTest>(`/placement/${courseId}/generate`);
}

export function submitPlacement(
  courseId: string,
  attemptId: string,
  answers: PlacementAnswer[],
): Promise<PlacementRecommendation> {
  return post<PlacementRecommendation>(`/placement/${courseId}/submit`, {
    attemptId,
    answers,
  });
}

export function addRecommendedToCart(
  courseId: string,
  attemptId: string,
): Promise<{ added: number; skipped: string[]; mode: PlacementMode }> {
  return post(`/placement/${courseId}/add-recommended`, { attemptId });
}
