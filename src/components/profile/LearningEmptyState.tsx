import Link from "next/link";
import { BookOpen, ArrowRight } from "lucide-react";

export default function LearningEmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center text-center py-16 px-6"
      aria-label="No courses enrolled"
    >
      <BookOpen
        size={48}
        strokeWidth={1.25}
        className="text-slate-300 mb-4"
        aria-hidden="true"
      />
      <h3 className="text-lg font-semibold text-slate-700 mb-1">
        No courses yet
      </h3>
      <p className="text-sm text-slate-500 mb-6 max-w-xs">
        Start learning today — browse hundreds of courses.
      </p>
      <Link
        href="/courses"
        className="inline-flex items-center gap-2 bg-[#3B1892] text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-[#2f1275] transition-colors duration-150"
      >
        Browse Courses
        <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </div>
  );
}
