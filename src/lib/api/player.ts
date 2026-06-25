// src/lib/api/player.ts
import type {
  PlayerCourse,
  ResumeData,
  ProgressPayload,
  ProgressResponse,
  Note,
} from "@/types/player";

const REMOTE_API =
  process.env.NESTJS_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://edugenie-api.vercel.app";

const SERVER_API_URL = REMOTE_API.endsWith("/api") ? REMOTE_API : `${REMOTE_API}/api`;

/** Resolves the correct base URL. */
function baseUrl(): string {
  return typeof window === "undefined" ? SERVER_API_URL : "/api/proxy";
}

// ─── Server-side helpers ──────────────────────────────────────────────────────

/**
 * Fetch full course data including sections, lessons, and per-lesson states.
 * Called server-side in page.tsx; pass the JWT token from cookies.
 */
export async function getCourseForPlayer(
  courseId: string,
  token?: string,
): Promise<PlayerCourse | null> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${baseUrl()}/courses/${encodeURIComponent(courseId)}`, {
      headers,
      cache: "no-store",
    });

    if (!res.ok) return null;

    const json = await res.json();

    // Normalise the response — the API may wrap the payload in `data` or `course`
    const raw: Record<string, unknown> =
      (json.course as Record<string, unknown>) ??
      (json.data as Record<string, unknown>) ??
      json;
    const id = String(raw.id ?? raw.id ?? "");
    if (!id || !raw.title) return null;

    const sections = Array.isArray(raw.sections)
      ? (raw.sections as Record<string, unknown>[]).map(normaliseSection)
      : [];

    const totalLessons =
      typeof raw.totalLessons === "number"
        ? raw.totalLessons
        : sections.reduce((a, s) => a + s.lessons.length, 0);

    return {
      id: String(raw.id),
      title: String(raw.title),
      thumbnail: typeof raw.thumbnail === "string" ? raw.thumbnail : "",
      totalLessons,
      sections,
    };
  } catch {
    return null;
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
  const lessons = Array.isArray(raw.lessons)
    ? (raw.lessons as Record<string, unknown>[]).map(normaliseLesson)
    : [];

  return {
    id: String(raw.id),
    title: typeof raw.title === "string" ? raw.title : "Section",
    description: typeof raw.description === "string" ? raw.description : "",
    isOwned: Boolean(raw.isOwned),
    isCompleted: Boolean(raw.isCompleted),
    lessons,
  };
}

function normaliseLesson(raw: Record<string, unknown>) {
  const state = (
    raw.state === "locked" ||
      raw.state === "available" ||
      raw.state === "in_progress" ||
      raw.state === "completed"
      ? raw.state
      : "locked"
  ) as import("@/types/player").LessonState;

  return {
    id: String(raw.id),
    title: typeof raw.title === "string" ? raw.title : "Lesson",
    videoUrl: typeof raw.videoUrl === "string" ? raw.videoUrl : "",
    videoPublicId:
      typeof raw.videoPublicId === "string" ? raw.videoPublicId : "",
    videoDuration:
      typeof raw.videoDuration === "number" ? raw.videoDuration : 0,
    state,
    watchedDuration:
      typeof raw.watchedDuration === "number" ? raw.watchedDuration : 0,
    transcript:
      typeof raw.transcript === "string" ? raw.transcript : undefined,
  };
}
