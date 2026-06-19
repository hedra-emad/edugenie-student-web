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
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  // Read JWT from cookies for server-side authenticated requests
  const cookieStore = await cookies();
  const token =
    cookieStore.get("token")?.value ??
    cookieStore.get("accessToken")?.value ??
    undefined;

  // Fetch course structure and resume position in parallel
  const [course, resume] = await Promise.all([
    getCourseForPlayer(courseId, token),
    getResumePosition(courseId, token),
  ]);
  console.log("token:", token);
  console.log("course:", course);
  // Hard redirect if the course doesn't exist or is inaccessible
  if (!course) redirect("/courses");

  // Determine the starting lesson:
  // 1. Use resume position if available
  // 2. Fall back to the first available/in_progress lesson
  // 3. Fall back to the very first lesson
  const allLessons = course.sections.flatMap((s) => s.lessons);

  const startLessonId =
    resume?.lessonId ??
    allLessons.find(
      (l) => l.state === "in_progress" || l.state === "available",
    )?._id ??
    allLessons[0]?._id ??
    "";

  const initialWatchedDuration = resume?.watchedDuration ?? 0;

  if (!startLessonId) redirect("/courses");

  return (
    <PlayerLayout
      course={course}
      initialLessonId={startLessonId}
      initialWatchedDuration={initialWatchedDuration}
    />
  );
}
