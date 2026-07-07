// src/lib/api/player.ts
import type {
  PlayerCourse,
  ResumeData,
  ProgressPayload,
  ProgressResponse,
  Note,
} from "@/types/player";
import { resolveApiBase } from "@/lib/apiBase";

const REMOTE_API =
  process.env.NESTJS_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://edugenie-api.vercel.app";

const SERVER_API_URL = resolveApiBase(REMOTE_API);

/** Resolves the correct base URL. */
function baseUrl(): string {
  return typeof window === "undefined" ? SERVER_API_URL : "/api/proxy";
}

// ─── Server-side helpers ──────────────────────────────────────────────────────

/**
 * Result of a course-for-player lookup, distinguishing *why* it failed so the
 * caller (page.tsx) can route the student somewhere sensible instead of a
 * single generic redirect:
 * - "not_found"  → the course id doesn't exist (backend 404) → send to My Courses.
 * - "unauthenticated" → no/invalid session (backend 401) → send to login.
 * - "forbidden"  → real course, but the caller has zero access to it
 *   (backend 403) → send to that course's purchase page, not a generic error.
 * - "error"      → network/parsing failure → safe generic fallback.
 */
export type CourseForPlayerResult =
  | { kind: "ok"; course: PlayerCourse }
  | { kind: "not_found" }
  | { kind: "unauthenticated" }
  | { kind: "forbidden" }
  | { kind: "error" };

/**
 * Fetch full course data including sections, lessons, and per-lesson states.
 * Called server-side in page.tsx; pass the JWT token from cookies.
 */
export async function getCourseForPlayer(
  courseId: string,
  token?: string,
): Promise<CourseForPlayerResult> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${baseUrl()}/courses/${encodeURIComponent(courseId)}`, {
      headers,
      cache: "no-store",
    });

    if (!res.ok) {
      if (res.status === 404) return { kind: "not_found" };
      if (res.status === 401) return { kind: "unauthenticated" };
      if (res.status === 403) return { kind: "forbidden" };
      return { kind: "error" };
    }

    const json = await res.json();

    // Normalise the response — the API may wrap the payload in `data` or `course`
    const raw: Record<string, unknown> =
      (json.course as Record<string, unknown>) ??
      (json.data as Record<string, unknown>) ??
      json;
    const id = String(raw.id ?? raw.id ?? "");
    if (!id || !raw.title) return { kind: "not_found" };

    const sections = Array.isArray(raw.sections)
      ? (raw.sections as Record<string, unknown>[]).map(normaliseSection)
      : [];

    const totalLessons =
      typeof raw.totalLessons === "number"
        ? raw.totalLessons
        : sections.reduce((a, s) => a + s.lessons.length, 0);

    return {
      kind: "ok",
      course: {
        id: String(raw.id),
        title: String(raw.title),
        thumbnail: typeof raw.thumbnail === "string" ? raw.thumbnail : "",
        totalLessons,
        sections,
      },
    };
  } catch {
    return { kind: "error" };
  }
}

/**
 * Fetch the resume position for a student inside a course.
 * Called server-side; pass the JWT token from cookies.
 */
export async function getResumePosition(
  courseId: string,
  token?: string,
): Promise<ResumeData | null> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(
      `${baseUrl()}/courses/${encodeURIComponent(courseId)}/resume`,
      { headers, cache: "no-store" },
    );

    if (!res.ok) return { lessonId: null, sectionId: null, watchedDuration: 0 };

    const json = await res.json();
    const raw: Record<string, unknown> =
      (json.data as Record<string, unknown>) ?? json;

    return {
      lessonId:
        typeof raw.lessonId === "string" && raw.lessonId ? raw.lessonId : null,
      sectionId:
        typeof raw.sectionId === "string" && raw.sectionId
          ? raw.sectionId
          : null,
      watchedDuration:
        typeof raw.watchedDuration === "number" ? raw.watchedDuration : 0,
    };
  } catch {
    return null;
  }
}

// ─── Client-side helpers ──────────────────────────────────────────────────────

/**
 * Save watch progress.  Called from the client every 30 s and on pause/unload.
 * Uses `credentials: "include"` so the session cookie is sent automatically.
 */
export async function saveProgress(
  data: ProgressPayload,
): Promise<ProgressResponse | null> {
  try {
    const res = await fetch(`${baseUrl()}/progress/lesson`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) return null;

    const json = await res.json();
    const raw: Record<string, unknown> =
      (json.data as Record<string, unknown>) ?? json;

    return {
      lessonState:
        (raw.lessonState as string) === "locked" ||
          (raw.lessonState as string) === "available" ||
          (raw.lessonState as string) === "in_progress" ||
          (raw.lessonState as string) === "completed"
          ? (raw.lessonState as ProgressResponse["lessonState"])
          : "in_progress",
      nextLessonUnlocked: Boolean(raw.nextLessonUnlocked),
      nextLesson:
        raw.nextLesson &&
          typeof (raw.nextLesson as Record<string, unknown>).id === "string"
          ? (raw.nextLesson as { id: string; title: string })
          : null,
      sectionCompleted: Boolean(raw.sectionCompleted),
      quizRequired: Boolean(raw.quizRequired),
      quizSectionId:
        typeof raw.quizSectionId === "string" ? raw.quizSectionId : null,
      courseProgress:
        typeof raw.courseProgress === "number" ? raw.courseProgress : undefined,
      completedLessons:
        typeof raw.completedLessons === "number"
          ? raw.completedLessons
          : undefined,
      totalLessons:
        typeof raw.totalLessons === "number" ? raw.totalLessons : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch existing notes for a lesson.
 */
export async function getNotes(lessonId: string): Promise<Note[]> {
  try {
    const res = await fetch(
      `${baseUrl()}/lessons/${encodeURIComponent(lessonId)}/notes`,
      { credentials: "include", cache: "no-store" },
    );

    if (!res.ok) return [];

    const json = await res.json();
    const notes = Array.isArray(json.notes)
      ? json.notes
      : Array.isArray(json.data)
        ? json.data
        : [];

    return notes.map(
      (n: Record<string, unknown>): Note => ({
        id: String(n.id),
        content: typeof n.content === "string" ? n.content : "",
        timestamp: typeof n.timestamp === "number" ? n.timestamp : 0,
        createdAt: typeof n.createdAt === "string" ? n.createdAt : "",
      }),
    );
  } catch {
    return [];
  }
}

/**
 * Save a new timestamped note for a lesson.
 */
export async function saveNote(
  lessonId: string,
  content: string,
  timestamp: number,
): Promise<Note | null> {
  try {
    const res = await fetch(
      `${baseUrl()}/lessons/${encodeURIComponent(lessonId)}/notes`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, timestamp }),
      },
    );

    if (!res.ok) return null;

    const json = await res.json();
    const raw: Record<string, unknown> =
      (json.data as Record<string, unknown>) ??
      (json.note as Record<string, unknown>) ??
      json;

    return {
      id: String(raw.id),
      content: typeof raw.content === "string" ? raw.content : content,
      timestamp: typeof raw.timestamp === "number" ? raw.timestamp : timestamp,
      createdAt: typeof raw.createdAt === "string" ? raw.createdAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

// ─── Internal normalisation helpers ──────────────────────────────────────────

function normaliseSection(raw: Record<string, unknown>) {
  const isOwned = Boolean(raw.isOwned);
  // When the backend omits `isUnlocked` (older payloads), fall back to ownership.
  const isUnlocked =
    typeof raw.isUnlocked === "boolean" ? raw.isUnlocked : isOwned;

  // Defense in depth: even if the backend's `/courses/:id` response embeds a
  // real videoUrl/transcript for a section the student hasn't unlocked, this
  // is the last frontend chokepoint before that data gets serialized into the
  // client-component props (and thus visible in the page's RSC payload /
  // devtools network tab). Strip it here rather than trusting the client UI's
  // `locked` conditionals to be the only thing standing between a curious
  // user and the paid video. The backend should also be fixed to never send
  // this field for unowned sections in the first place (flagged separately).
  const lessons = Array.isArray(raw.lessons)
    ? (raw.lessons as Record<string, unknown>[]).map((l) =>
        normaliseLesson(l, isUnlocked),
      )
    : [];

  const lockReason = (
    raw.lockReason === "not_purchased" || raw.lockReason === "locked_progress"
      ? raw.lockReason
      : null
  ) as import("@/types/player").SectionLockReason;

  return {
    id: String(raw.id),
    title: typeof raw.title === "string" ? raw.title : "Section",
    description: typeof raw.description === "string" ? raw.description : "",
    isOwned,
    isCompleted: Boolean(raw.isCompleted),
    isUnlocked,
    hasQuiz: Boolean(raw.hasQuiz),
    lockReason,
    requiredSectionId:
      typeof raw.requiredSectionId === "string" ? raw.requiredSectionId : null,
    requiredSectionTitle:
      typeof raw.requiredSectionTitle === "string"
        ? raw.requiredSectionTitle
        : null,
    lessons,
  };
}

function normaliseLesson(raw: Record<string, unknown>, sectionUnlocked: boolean) {
  const state = (
    raw.state === "locked" ||
      raw.state === "available" ||
      raw.state === "in_progress" ||
      raw.state === "completed"
      ? raw.state
      : "locked"
  ) as import("@/types/player").LessonState;

  // A lesson is only *actually* playable when its section is unlocked AND
  // the lesson itself isn't individually locked (progress-gated). Anything
  // else must not carry a real video URL / transcript to the client.
  const accessible = sectionUnlocked && state !== "locked";

  return {
    id: String(raw.id),
    title: typeof raw.title === "string" ? raw.title : "Lesson",
    videoUrl: accessible && typeof raw.videoUrl === "string" ? raw.videoUrl : "",
    videoPublicId:
      accessible && typeof raw.videoPublicId === "string" ? raw.videoPublicId : "",
    videoDuration:
      typeof raw.videoDuration === "number" ? raw.videoDuration : 0,
    state,
    watchedDuration:
      typeof raw.watchedDuration === "number" ? raw.watchedDuration : 0,
    transcript:
      accessible && typeof raw.transcript === "string" ? raw.transcript : undefined,
    transcriptSegments:
      accessible && Array.isArray(raw.transcriptSegments)
        ? (raw.transcriptSegments as unknown[])
            .map((s) => {
              const o = (s ?? {}) as Record<string, unknown>;
              return {
                start: typeof o.start === "number" ? o.start : 0,
                text: typeof o.text === "string" ? o.text : "",
              };
            })
            .filter((s) => s.text.length > 0)
        : undefined,
  };
}
