import Link from "next/link";
import { ArrowRight } from "lucide-react";
import CourseCard from "@/components/courses/CourseCard";
import { Course } from "@/types/course";

const DISPLAY = { fontFamily: "var(--font-hanken-grotesk)" } as const;

export default function FeaturedV2({
  courses = [],
  limit = 6,
}: {
  courses?: Course[];
  limit?: number;
}) {
  const visible = courses.slice(0, limit);

  return (
    <section className="bg-white py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex items-end justify-between gap-4 flex-wrap mb-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-secondary" />
              <span className="text-xs font-bold tracking-[0.2em] text-primary uppercase">
                Featured courses
              </span>
            </div>
            <h2
              style={DISPLAY}
              className="text-[1.9rem] sm:text-[2.5rem] font-extrabold tracking-tight text-slate-900 leading-[1.1]"
            >
              Start where the momentum is.
            </h2>
            <p className="mt-3 text-[15px] text-slate-500 max-w-lg leading-relaxed">
              Top-rated courses, each with its own AI tutor and mastery
              checkpoints built in.
            </p>
          </div>
          <Link
            href="/courses"
            className="group inline-flex items-center gap-1.5 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            View all courses
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </div>

        {visible.length > 0 ? (
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-200 py-20 text-center">
            <p className="text-base font-semibold text-slate-500">
              No courses published yet.
            </p>
            <p className="mt-1 text-sm text-slate-400">
              New courses are on the way — check back soon.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
