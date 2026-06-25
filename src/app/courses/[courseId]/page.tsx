// app/courses/[courseId]/page.tsx
import { redirect } from "next/navigation";
import type { Course } from "./types/course";

import CourseHero from "../../../components/courseId/_components/CourseHero";
import CourseCurriculum from "../../../components/courseId/_components/CourseCurriculum";
import CourseDescription from "../../../components/courseId/_components/CourseDescription";
import CourseInstructor from "../../../components/courseId/_components/CourseInstructor";
import EnrollCard from "../../../components/courseId/_components/EnrollCard";

const API_BASE =
  process.env.NESTJS_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://edugenie-api.vercel.app";
const SERVER_API_URL = API_BASE.endsWith("/api") ? API_BASE : `${API_BASE}/api`;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function extractCoursePayload(json: unknown): Record<string, unknown> | null {
  const root = asRecord(json);
  if (!root) return null;

  const candidate = asRecord(root.course ?? root.data) ?? root;
  if (!(candidate._id || candidate.id) || !candidate.title) return null;

  return candidate;
}

function normalizeCourse(raw: Record<string, unknown>): Course {
  const instructorRaw =
    asRecord(raw.instructorId) ?? asRecord(raw.instructor) ?? {};
  const instructorName =
    typeof instructorRaw.name === "string" ? instructorRaw.name.trim() : "";
  const nameParts = instructorName.split(/\s+/).filter(Boolean);

  const firstName =
    typeof instructorRaw.firstName === "string" && instructorRaw.firstName
      ? instructorRaw.firstName
      : (nameParts[0] ?? "Instructor");
  const lastName =
    typeof instructorRaw.lastName === "string"
      ? instructorRaw.lastName
      : nameParts.slice(1).join(" ");

  const categoryRaw =
    asRecord(raw.categoryId) ?? asRecord(raw.category) ?? {};

  return {
    id: String(raw._id ?? raw.id),
    title: String(raw.title),
    description:
      typeof raw.description === "string" ? raw.description : "",
    price: typeof raw.price === "number" ? raw.price : 0,
    thumbnail: typeof raw.thumbnail === "string" ? raw.thumbnail : "",
    level:
      raw.level === "beginner" ||
      raw.level === "intermediate" ||
      raw.level === "advanced"
        ? raw.level
        : "beginner",
    courseStatus:
      typeof raw.courseStatus === "string"
        ? raw.courseStatus
        : typeof raw.status === "string"
          ? raw.status
          : "",
    instructorId: {
      id: String(instructorRaw._id ?? instructorRaw.id ?? ""),
      firstName,
      lastName,
      avatar:
        typeof instructorRaw.avatar === "string" ? instructorRaw.avatar : "",
    },
    categoryId: {
      id: String(categoryRaw._id ?? categoryRaw.id ?? ""),
      name: typeof categoryRaw.name === "string" ? categoryRaw.name : "Course",
      iconUrl:
        typeof categoryRaw.iconUrl === "string" ? categoryRaw.iconUrl : "",
      slug: typeof categoryRaw.slug === "string" ? categoryRaw.slug : "",
    },
    goals: Array.isArray(raw.goals)
      ? raw.goals.filter((goal): goal is string => typeof goal === "string")
      : [],
    requirements: Array.isArray(raw.requirements)
      ? raw.requirements.filter(
          (item): item is string => typeof item === "string",
        )
      : [],
    ratingAverage:
      typeof raw.ratingAverage === "number" ? raw.ratingAverage : 0,
    totalEnrollments:
      typeof raw.totalEnrollments === "number" ? raw.totalEnrollments : 0,
    totalLessons: typeof raw.totalLessons === "number" ? raw.totalLessons : 0,
    totalVideos: typeof raw.totalVideos === "number" ? raw.totalVideos : 0,
    totalHours: typeof raw.totalHours === "number" ? raw.totalHours : 0,
    sections: Array.isArray(raw.sections) ? raw.sections : [],
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : "",
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : "",
    isEnrolled: Boolean(raw.isEnrolled),
  };
}

async function getCourse(id: string): Promise<Course | null> {
  if (!id) return null;

  try {
    const res = await fetch(
      `${SERVER_API_URL}/courses/${encodeURIComponent(id)}`,
      { cache: "no-store" },
    );

    if (!res.ok) return null;

    const json: unknown = await res.json();
    const payload = extractCoursePayload(json);
    if (!payload) return null;

    return normalizeCourse(payload);
  } catch {
    return null;
  }
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = await getCourse(courseId);

  if (!course) redirect("/courses");

  return (
    <main className="min-h-screen bg-slate-50">
      <CourseHero course={course} />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_352px] gap-10 items-stretch">
          <div className="flex flex-col gap-6">
            <section className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-[15px] font-bold text-slate-900 mb-4">
                What you&apos;ll learn
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {course.goals.map((goal, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="mt-[3px] w-4 h-4 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-2.5 h-2.5 text-white"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span className="text-[13.5px] text-slate-700 leading-snug">
                      {goal}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <CourseCurriculum
              sections={course.sections}
              isEnrolled={course.isEnrolled ?? false}
            />
            <CourseDescription
              description={course.description}
              requirements={course.requirements}
            />
            <CourseInstructor instructor={course.instructorId} />
          </div>

          <div className="lg:sticky lg:top-6">
            <EnrollCard course={course} />
          </div>
        </div>
      </div>
    </main>
  );
}
