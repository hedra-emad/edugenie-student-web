// Semantic lesson search across the whole published catalog — vector search
// over lesson transcripts, returning course + section + lesson titles. Public
// (no enrollment required). Client-side via the BFF proxy.

const PROXY = process.env.NEXT_PUBLIC_API_BASE || '/api/proxy';

export interface LessonHit {
  courseId: string;
  courseTitle: string;
  lessonId: string;
  lessonTitle: string;
  sectionTitle: string;
  /** Start time (seconds) of the matched moment, when the transcript is time-coded. */
  start?: number;
  /** True when the signed-in student can open this lesson (drives the seek chip). */
  owned: boolean;
  score: number;
}

export async function searchLessons(q: string): Promise<LessonHit[]> {
  const query = q.trim();
  if (!query) return [];
  try {
    const res = await fetch(
      `${PROXY}/courses/lesson-search?q=${encodeURIComponent(query)}`,
      { credentials: 'include', cache: 'no-store' },
    );
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: LessonHit[] };
    return Array.isArray(json?.data) ? json.data : [];
  } catch {
    return [];
  }
}
