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
  const course = await getCourseForPlayer(courseId);
  return {
    title: course ? `${course.title} — EduGenie` : "Learn — EduGenie",
  };
}

export default async function LearnPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ lesson?: string }>;
}) {
  const { courseId } = await params;
  const { lesson: requestedLessonId } = await searchParams;

  // Read JWT from cookies for server-side authenticated requests
  const cookieStore = await cookies();
  const token = cookieStore.get("jwt")?.value ?? undefined;

  // Fetch course structure and resume position in parallel
  const [course, resume] = await Promise.all([
    getCourseForPlayer(courseId, token),
    getResumePosition(courseId, token),
  ]);
  // Hard redirect if the course doesn't exist or is inaccessible
  if (!course) redirect("/courses");

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
  // deep-linked one.
  const initialWatchedDuration = deepLinked ? 0 : (resume?.watchedDuration ?? 0);

  if (!startLessonId) redirect("/courses");

  return (
    <PlayerLayout
      course={course}
      initialLessonId={startLessonId}
      initialWatchedDuration={initialWatchedDuration}
    />
  );
}
