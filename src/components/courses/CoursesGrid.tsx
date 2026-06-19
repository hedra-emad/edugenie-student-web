"use client";

import { BookOpen } from "lucide-react";
import CourseCard from "./CourseCard";
import { Course } from "@/types/course";

// ─── Skeleton Card 

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden
                    shadow-[0_2px_12px_rgba(0,0,0,0.06)] animate-pulse">
      <div className="h-[168px] bg-slate-200" />
      <div className="px-4 pt-4 pb-0">
        <div className="h-5 w-24 bg-slate-200 rounded-full mb-3" />
        <div className="h-4 bg-slate-200 rounded mb-2" />
        <div className="h-4 w-3/4 bg-slate-200 rounded mb-4" />
        <div className="h-4 w-1/2 bg-slate-200 rounded mb-3" />
        <div className="flex gap-2 mb-3">
          <div className="h-3 w-16 bg-slate-200 rounded" />
          <div className="h-3 w-14 bg-slate-200 rounded" />
        </div>
        <div className="h-3 w-24 bg-slate-200 rounded" />
      </div>
      <div className="h-[60px] px-4 mt-3 flex items-center justify-between
                      border-t border-slate-100">
        <div className="h-5 w-12 bg-slate-200 rounded" />
        <div className="h-8 w-24 bg-slate-200 rounded-full" />
      </div>
    </div>
  );
}

// ─── Empty State

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center
                    py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-violet-50 border border-violet-100
                      flex items-center justify-center mb-4">
        <BookOpen size={28} className="text-violet-400" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-2">
        No courses found
      </h3>
      <p className="text-sm text-slate-400 max-w-xs leading-relaxed mb-6">
        We couldnt find any courses matching your filters. Try adjusting your search.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="
          px-6 py-2.5 rounded-full bg-[#3B1892] text-white
          text-sm font-bold
          hover:bg-violet-700 hover:shadow-[0_4px_14px_rgba(124,58,237,0.4)]
          transition-all duration-200
        "
      >
        Clear All Filters
      </button>
    </div>
  );
}

// ─── CoursesGrid 

interface Props {
  courses:    Course[];
  isLoading:  boolean;
  isFetching: boolean;
  onReset:    () => void;
  limit:      number;
}

export default function CoursesGrid({
  courses, isLoading, isFetching, onReset, limit,
}: Props) {

  return (
    <div className={`
      grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5
      transition-opacity duration-200
      ${isFetching && !isLoading ? "opacity-60" : "opacity-100"}
    `}>
      {isLoading
        ? Array.from({ length: limit }).map((_, i) => <SkeletonCard key={i} />)
        : courses.length === 0
          ? <EmptyState onReset={onReset} />
          : courses.map((course) => <CourseCard key={course.id} course={course} />)
      }
    </div>
  );
}