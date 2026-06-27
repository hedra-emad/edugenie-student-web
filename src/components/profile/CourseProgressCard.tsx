"use client";

import Image from "next/image";
import Link from "next/link";
import type { EnrolledCourse } from "@/types/profile.types";

interface Props {
  course: EnrolledCourse;
}

export default function CourseProgressCard({ course }: Props) {
  const isCompleted = course.progressPercent === 100;

  return (
    <Link
      href={`/learn/${course.courseId}`}
      className="group flex gap-3 p-3 rounded-xl border border-slate-200
                 hover:border-[#3B1892]/30 hover:bg-slate-50
                 transition-all duration-150"
    >
      {/* Thumbnail */}
      <div className="relative w-20 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100">
        <Image
          src={course.thumbnail}
          alt={course.title}
          fill
          sizes="80px"
          className="object-cover"
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 line-clamp-2
                      group-hover:text-[#3B1892] transition-colors duration-150 leading-snug">
          {course.title}
        </p>

        {/* Progress bar */}
        <div className="mt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-400">
              {isCompleted ? "Completed" : "In Progress"}
            </span>
            <span className="text-xs font-semibold text-slate-600">
              {course.progressPercent}%
            </span>
          </div>
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isCompleted ? "bg-emerald-500" : "bg-[#3B1892]"
              }`}
              style={{ width: `${course.progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

export function CourseProgressCardSkeleton() {
  return (
    <div className="flex gap-3 p-3 rounded-xl border border-slate-200 animate-pulse">
      <div className="w-20 h-14 flex-shrink-0 rounded-lg bg-slate-200" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-3 bg-slate-200 rounded w-4/5" />
        <div className="h-3 bg-slate-200 rounded w-3/5" />
        <div className="h-1.5 bg-slate-200 rounded-full mt-3" />
      </div>
    </div>
  );
}
