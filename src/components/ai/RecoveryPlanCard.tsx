"use client";
// components/ai/RecoveryPlanCard.tsx
// Renders active AI recovery plans (built after failing a section quiz on all
// attempts). Each item deep-links back into the player at the exact lesson.

import Link from "next/link";
import type { RemediationPlan } from "@/lib/api/remediation";

export default function RecoveryPlanCard({
  plans,
}: {
  plans: RemediationPlan[];
}) {
  if (!plans.length) return null;

  return (
    <div className="mb-5 space-y-4">
      {plans.map((plan) => (
        <div
          key={plan.id}
          id={`recovery-${plan.sectionId}`}
          className="scroll-mt-24 rounded-2xl border border-rose-200 bg-rose-50/60 p-4 sm:p-5"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500 text-white">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14.5px] font-bold text-rose-900">
                Recovery plan · {plan.sectionTitle}
              </p>
              <p className="text-[12.5px] text-rose-600">
                {plan.courseTitle}
              </p>
            </div>
          </div>

          {plan.missedConcepts.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {plan.missedConcepts.map((c) => (
                <span
                  key={c}
                  className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-rose-700 ring-1 ring-rose-200"
                >
                  {c}
                </span>
              ))}
            </div>
          )}

          <div className="mt-3 space-y-2">
            {plan.items.map((item) => (
              <Link
                key={item.lessonId}
                href={`/learn/${plan.courseId}?lesson=${item.lessonId}`}
                className="group flex items-start gap-3 rounded-xl border border-rose-100 bg-white px-3.5 py-3 transition-colors hover:border-rose-300 hover:bg-rose-50"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600 group-hover:bg-rose-200">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-semibold text-slate-800">
                    {item.lessonTitle}
                  </p>
                  {item.reason && (
                    <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-slate-500">
                      {item.reason}
                    </p>
                  )}
                </div>
                <svg className="mt-1 h-4 w-4 shrink-0 text-rose-300 transition-transform group-hover:translate-x-0.5 group-hover:text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </Link>
            ))}
          </div>

          <Link
            href={`/learn/${plan.courseId}/quiz/${plan.sectionId}`}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-rose-700"
          >
            Retake the section quiz
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>
        </div>
      ))}
    </div>
  );
}
