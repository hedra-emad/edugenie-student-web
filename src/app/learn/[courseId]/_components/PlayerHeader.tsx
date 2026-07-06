"use client";
// _components/PlayerHeader.tsx

import Link from "next/link";

interface Props {
  courseId: string;
  courseTitle: string;
  currentLessonTitle: string;
  completedLessons: number;
  totalLessons: number;
  /**
   * Id of the earned certificate for this course, if one exists. Certificates
   * are issued for FULL-COURSE completions only, so a section-only student who
   * finishes their scope has none — the button must reflect the real credential,
   * not just 100% of the owned scope.
   */
  certificateId?: string;
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
}

export default function PlayerHeader({
  courseId,
  courseTitle,
  currentLessonTitle,
  completedLessons,
  totalLessons,
  certificateId,
  onToggleSidebar,
  sidebarOpen,
}: Props) {
  const pct = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  return (
    <>
      {/* Bar 1 — Site Header (sticky) */}
      <header className="flex-shrink-0 sticky top-0 z-50 bg-white border-b border-slate-200">
        <div className="h-14 flex items-center justify-between px-4 sm:px-6 gap-4">
          {/* Left — logo */}
          <Link
            href="/"
            className="text-[15px] font-extrabold text-[#3B1892] tracking-tight shrink-0"
            aria-label="Back to EduGenie home"
          >
            EduGenie
          </Link>

          {/* Right — progress text + mobile toggle */}
          <div className="flex items-center gap-3 shrink-0">
            {certificateId && (
              <Link
                href={`/certificate/${certificateId}`}
                className="hidden sm:inline-flex items-center gap-1.5 text-[12.5px] font-semibold
                           text-white bg-[#3B1892] hover:opacity-90 px-3 py-1.5 rounded-xl
                           transition-opacity whitespace-nowrap"
              >
                🎓 Certificate
              </Link>
            )}
            <span className="text-[12px] font-semibold text-slate-500 whitespace-nowrap">
              {completedLessons} of {totalLessons} lessons complete
            </span>

            {onToggleSidebar && (
              <button
                type="button"
                onClick={onToggleSidebar}
                className="lg:hidden flex items-center gap-1.5 text-[12.5px] font-semibold
                           text-[#3B1892] border border-[#3B1892]/30 hover:bg-violet-50
                           px-3 py-1.5 rounded-xl transition-colors"
                aria-label={sidebarOpen ? "Close contents" : "Open contents"}
              >
                {sidebarOpen ? (
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                  </svg>
                )}
                Contents
              </button>
            )}
          </div>
        </div>

        {/* Progress bar — h-0.5 at bottom of header */}
        <div className="h-0.5 bg-slate-100">
          <div
            className="h-full bg-[#3B1892] transition-[width] duration-500 ease-out"
            style={{ width: `${pct}%` }}
            role="progressbar"
            aria-valuenow={Math.round(pct)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Course progress: ${Math.round(pct)}%`}
          />
        </div>
      </header>

      {/* Bar 2 — Breadcrumb (My Courses > Course > Lesson) */}
      <div className="flex-shrink-0 bg-white border-b border-slate-200 px-6 py-2">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-widest"
        >
          <Link href="/profile" className="shrink-0 hover:text-primary transition-colors">
            My Courses
          </Link>
          <span className="shrink-0" aria-hidden="true">›</span>
          <Link
            href={`/courses/${courseId}`}
            className="min-w-0 truncate hover:text-primary transition-colors"
          >
            {courseTitle}
          </Link>
        </nav>
        <p
          className="text-sm font-bold text-slate-800 truncate mt-0.5"
          aria-current="page"
        >
          {currentLessonTitle}
        </p>
      </div>
    </>
  );
}
