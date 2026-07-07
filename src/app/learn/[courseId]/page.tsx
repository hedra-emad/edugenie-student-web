// src/app/learn/[courseId]/page.tsx
// Server Component — fetches course structure + resume position in parallel.
// No site Header/Footer — this is a focused learning environment.

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getCourseForPlayer, getResumePosition } from "@/lib/api/player";
import PlayerLayout from "./_components/PlayerLayout";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const result = await getCourseForPlayer(courseId);
  return {
    title: result.kind === "ok" ? `${result.course.title} — EduGenie` : "Learn — EduGenie",
  };
}

export default async function LearnPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ lesson?: string; t?: string }>;
}) {
  const { courseId } = await params;
  const { lesson: requestedLessonId, t } = await searchParams;

  // Read JWT from cookies for server-side authenticated requests
  const cookieStore = await cookies();
  const token = cookieStore.get("jwt")?.value ?? undefined;

  // Fetch course structure and resume position in parallel
  const [result, resume] = await Promise.all([
    getCourseForPlayer(courseId, token),
    getResumePosition(courseId, token),
  ]);

  // Server-side gate — never render the player shell for a course the
  // student can't access; redirect before any lesson data reaches the client.
  if (result.kind === "unauthenticated") redirect("/login");
  if (result.kind === "not_found") redirect("/profile");
  if (result.kind === "forbidden") redirect(`/courses/${courseId}`);
  if (result.kind === "error") redirect("/profile");

  const course = result.course;

  const allLessons = course.sections.flatMap((s) => s.lessons);

  // Deep-link: `?lesson=<id>` (e.g. from a tutor citation) opens that exact
  // lesson, as long as it exists and the student has it unlocked.
  const deepLinked = requestedLessonId
    ? allLessons.find(
        (l) => l.id === requestedLessonId && l.state !== "locked",
      )
    : undefined;

  // Otherwise: resume → first available/in_progress → first lesson.
  const startLessonId =
    deepLinked?.id ??
    resume?.lessonId ??
    allLessons.find(
      (l) => l.state === "in_progress" || l.state === "available",
    )?.id ??
    allLessons[0]?.id ??
    "";

  // Resume's watched-duration only applies to the resumed lesson, not a
  // deep-linked one. A `?t=<seconds>` deep-link (from a search-result timestamp
  // chip) opens the lesson AND seeks there — reusing the resume-seek path, which
  // applies `initialWatchedDuration` to the video on load.
  const seekSeconds = t !== undefined ? Math.max(0, Math.floor(Number(t))) : NaN;
  const initialWatchedDuration = deepLinked
    ? Number.isFinite(seekSeconds)
      ? seekSeconds
      : 0
    : (resume?.watchedDuration ?? 0);

  if (!startLessonId) redirect("/courses");

  return (
    <PlayerLayout
      course={course}
      initialLessonId={startLessonId}
      initialWatchedDuration={initialWatchedDuration}
    />
  );
}
