'use client';
// "Jump to a lesson in your courses" — semantic hits from the student's own
// course transcripts, deep-linking into the player at the matching lesson.

import Link from 'next/link';
import type { LessonHit } from '@/lib/api/search';

export default function LessonResults({ hits }: { hits: LessonHit[] }) {
  if (!hits.length) return null;
  return (
    <div className="mb-7 rounded-2xl border border-violet-200 bg-violet-50/40 p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#3B1892] text-white">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <path d="m21 21-4.3-4.3M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z" />
          </svg>
        </span>
        <p className="text-[13.5px] font-bold text-slate-800">
          Jump to a lesson in your courses
        </p>
      </div>
      <div className="space-y-2">
        {hits.map((h) => (
          <Link
            key={`${h.lessonId}-${h.snippet.slice(0, 12)}`}
            href={`/learn/${h.courseId}?lesson=${h.lessonId}`}
            className="block rounded-xl border border-violet-100 bg-white px-4 py-3 transition-colors hover:border-[#3B1892]/40 hover:bg-white"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="min-w-0 truncate text-[13px] font-semibold text-slate-800">
                {h.lessonTitle || 'Lesson'}
              </p>
              {h.sectionTitle && (
                <span className="flex-shrink-0 text-[11px] font-medium text-slate-400">
                  {h.sectionTitle}
                </span>
              )}
            </div>
            {h.snippet && (
              <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-slate-500">
                “{h.snippet}”
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
