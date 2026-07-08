import { Course } from "@/types/course";
import { resolveApiBase } from "@/lib/apiBase";

const REMOTE_API_URL =
  process.env.NESTJS_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://edugenie-api.vercel.app";

const SERVER_API_URL = resolveApiBase(REMOTE_API_URL);

export interface TopInstructor {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  skills?: string[];
  rating?: number;
  studentsCount?: number;
  coursesCount?: number;
}

/**
 * Top instructors for the public home page — public data, fetched server-side
 * without auth and cached with ISR, mirroring `fetchCoursesForHome`.
 */
export async function fetchTopInstructors(limit = 4): Promise<TopInstructor[]> {
  const url = `${SERVER_API_URL}/courses/top-instructors?limit=${limit}&sort=students`;

  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    next: { revalidate: 300 }, // public list — revalidate every 5 min
  });

  if (!res.ok) return [];

  const json = await res.json();
  return (json?.data?.data ?? json?.data ?? []) as TopInstructor[];
}

/** Courses taught by a single instructor — public data behind the instructor's profile page. */
export async function fetchInstructorCourses(instructorId: string): Promise<Course[]> {
  const url = `${SERVER_API_URL}/courses/instructor/${instructorId}`;

  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    next: { revalidate: 300 },
  });

  if (!res.ok) return [];

  const json = await res.json();
  return (json?.data?.courses ?? []) as Course[];
}
