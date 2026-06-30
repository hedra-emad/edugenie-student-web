'use client';
// Surfaces active quiz-recovery plans: when a student fails a section quiz the
// final time, the coach lists the exact lessons to rewatch, each deep-linking
// into the player at that lesson (/learn/:courseId?lesson=:lessonId).

import Link from 'next/link';
import type { RemediationPlan } from '@/lib/api/remediation';

export default function RecoveryPlanCard({
  plans,
}: {
  plans: RemediationPlan[];
}) {
  if (!plans.length) return null;

  return (
    <div className="mb-5 space-y-3">
      {plans.map((p) => (
        <div
          key={p.id}
          id={`recovery-${p.sectionId}`}
          className="scroll-mt-24 rounded-2xl border border-rose-200 bg-rose-50/50 p-4"
        >
          <div className="mb-3 flex items-start gap-2">
            <svg
              className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-rose-700">
                Recovery plan · {p.sectionTitle}
              </p>
              <p className="truncate text-[11.5px] text-rose-500/80">
                {p.courseTitle} · rewatch these, then retake the quiz
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {p.items.map((it) => (
              <Link
                key={it.lessonId}
                href={`/learn/${p.courseId}?lesson=${it.lessonId}`}
                className="group flex items-center justify-between gap-3 rounded-xl border border-rose-100 bg-white px-3.5 py-2.5 transition-colors hover:border-rose-300"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-slate-700">
                    {it.lessonTitle}
                  </p>
                  <p className="truncate text-[11.5px] text-slate-400">
                    {it.reason}
                  </p>
                </div>
                <span className="flex flex-shrink-0 items-center gap-1 text-[12px] font-semibold text-rose-600 transition-colors group-hover:text-rose-700">
                  Rewatch
                  <svg
                    className="h-3.5 w-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
