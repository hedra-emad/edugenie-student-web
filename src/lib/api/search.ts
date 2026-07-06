// Semantic in-course lesson search — vector search over the transcripts of the
// courses the student can access. Returns lesson hits that deep-link into the
// player. Client-side via the BFF proxy (JWT cookie attached there).

const PROXY = process.env.NEXT_PUBLIC_API_BASE || '/api/proxy';

export interface LessonHit {
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  sectionTitle: string;
  snippet: string;
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
