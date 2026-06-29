"use client";

import Link from "next/link";
import { useState } from "react";
import CourseCard from "@/components/courses/CourseCard";
import { Course } from "@/types/course";

// ─── FeaturedCourses Section ──────────────────────────────────────────────────

export default function FeaturedCourses({
  courses = [],
  limit = 3,
}: {
  courses?: Course[];
  limit?: number;
}) {
  const visibleCourses = courses.slice(0, limit);

  return (
    <section className="bg-[#f0f2f5] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1200px] mx-auto">

        {/* ── HEADER ── */}
        <div className="flex items-end justify-between gap-4 mb-8 flex-wrap">
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="w-2 h-2 rounded-full bg-violet-600 inline-block flex-shrink-0" />
              <span className="text-xs font-bold tracking-widest text-violet-600 uppercase">
                Featured Courses
              </span>
            </div>
            <h2
              className="text-[1.85rem] leading-tight tracking-tight mb-1 text-slate-900"
              style={{ fontWeight: 800 }}
            >
              Handpicked for your growth
            </h2>
            <p className="text-sm text-slate-500">
              Top-rated courses selected by our experts — loved by thousands of students.
            </p>
          </div>

          <Link
            href="/courses"
            className="
              text-sm font-bold text-violet-600 hover:text-violet-800
              flex items-center gap-1 transition-all duration-200
              hover:gap-2 whitespace-nowrap flex-shrink-0
            "
          >
            View All Courses →
          </Link>
        </div>

        {/* ── GRID ── */}
        {visibleCourses.length > 0 ? (
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {visibleCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <p className="text-base font-semibold">No courses available yet.</p>
            <p className="text-sm mt-1">Check back soon — more are coming!</p>
          </div>
        )}

      </div>
    </section>
  );
}