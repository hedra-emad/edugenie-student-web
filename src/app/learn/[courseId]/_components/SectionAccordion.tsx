"use client";
// _components/SectionAccordion.tsx

import { useState } from "react";
import Link from "next/link";
import type { PlayerSection, PlayerLesson } from "@/types/player";
import LessonItem from "./LessonItem";

interface Props {
  section: PlayerSection;
  courseId: string;
  courseTitle?: string;
  activeLessonId: string;
  globalLessonIndex: number; // 1-based index of the first lesson in this section
  defaultOpen?: boolean;
  completedLessons?: Set<string>;
  onLessonClick: (lesson: PlayerLesson) => void;
  onQuizSection: (sectionId: string, label: string) => void;
}

function formatSectionDuration(sections: PlayerSection["lessons"]): string {
  const total = sections.reduce((a, l) => a + l.videoDuration, 0);
  const m = Math.floor(total / 60);
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const rem = m % 60;
    return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
  }
  return `${m}m`;
}

function LockIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 inline mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

export default function SectionAccordion({
  section,
  courseId,
  courseTitle,
  activeLessonId,
  globalLessonIndex,
  defaultOpen = false,
  completedLessons,
  onLessonClick,
  onQuizSection,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  // Lock state (backend `applyStudentAccess`).
  const notPurchased = section.lockReason === "not_purchased" || !section.isOwned;
  const progressLocked = section.lockReason === "locked_progress";
  const locked = !section.isUnlocked;

  const isDone = (l: PlayerLesson) =>
    completedLessons?.has(l.id) || l.state === "completed";
  const completedInSection = section.lessons.filter(isDone).length;

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      {/* Section header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-start gap-3 px-4 py-3 text-left bg-slate-50
                   border-b border-slate-200 transition-colors focus:outline-none
                   focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#3B1892]
                   ${locked ? "opacity-70" : ""}`}
        aria-expanded={open}
      >
        <div className="flex-1 min-w-0 text-left flex flex-col gap-2">
          <div className="flex items-start gap-1.5">
            <p className="text-[13px] font-bold text-slate-800 leading-snug">
              {section.title}
            </p>
            {locked && <LockIcon />}
          </div>
          <p className="text-[11px] text-slate-400">
            {section.lessons.length} lessons
            {section.lessons.length > 0 &&
              ` · ${formatSectionDuration(section.lessons)}`}
            {section.isOwned &&
              !locked &&
              section.lessons.length > 0 &&
              ` · ${completedInSection}/${section.lessons.length} done`}
          </p>
          {/* Status chip */}
          {notPurchased ? (
            <span className="self-start inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
              Not purchased
            </span>
          ) : progressLocked ? (
            <span className="self-start inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
              Locked · pass previous quiz
            </span>
          ) : section.hasQuiz ? (
            <span className="self-start inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-[#3B1892]">
              Quiz gate
            </span>
          ) : null}
        </div>

        <ChevronIcon open={open} />
      </button>

      {/* Body */}
      {open && (
        <div className="bg-white">
          {/* Not purchased → buy panel */}
          {notPurchased && (
            <div className="px-3 pt-3 pb-1">
              <p className="text-[12.5px] text-slate-500 px-1">
                This section isn’t included in your enrollment.
              </p>
              <Link
                href={`/courses/${courseId}`}
                className="mt-2 block w-full rounded-lg border border-[#3B1892] px-3 py-2 text-center text-xs font-bold text-[#3B1892] transition-colors hover:bg-violet-50"
              >
                Buy this section
              </Link>
            </div>
          )}

          {/* Owned but progress-locked → point at the gating quiz */}
          {!notPurchased && progressLocked && (
            <div className="px-3 pt-3 pb-1">
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                <p className="text-[12px] leading-relaxed text-amber-800">
                  Unlocks once you pass the quiz for{" "}
                  <span className="font-semibold">
                    {section.requiredSectionTitle ?? "the previous section"}
                  </span>{" "}
                  with 80%.
                </p>
                {section.requiredSectionId && (
                  <Link
                    href={`/learn/${courseId}/quiz/${section.requiredSectionId}`}
                    className="mt-2 inline-block rounded-lg bg-amber-500 px-3 py-1.5 text-[11.5px] font-bold text-white transition-colors hover:bg-amber-600"
                  >
                    Go to that quiz
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Owned + unlocked → quiz actions */}
          {!locked && section.lessons.length > 0 && (
            <div className="px-3 pt-3 space-y-2">
              {section.hasQuiz && (
                <Link
                  href={`/learn/${courseId}/quiz/${section.id}`}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#3B1892] px-3 py-2 text-[12px] font-bold text-white transition-colors hover:bg-[#2A1069]"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <rect x="5" y="11" width="14" height="10" rx="2" />
                    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                  </svg>
                  Take section quiz to unlock next
                </Link>
              )}
              <button
                type="button"
                onClick={() =>
                  onQuizSection(
                    section.id,
                    `${courseTitle ? `${courseTitle} › ` : ""}${section.title}`,
                  )
                }
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#3B1892]/30 bg-violet-50 px-3 py-2 text-[12px] font-bold text-[#3B1892] transition-colors hover:bg-violet-100"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
                </svg>
                Practice (ungraded)
              </button>
            </div>
          )}

          {/* Lessons */}
          <div className="mt-3">
            {section.lessons.map((lesson, lIdx) => (
              <div key={lesson.id} className={locked ? "opacity-60" : ""}>
                <LessonItem
                  lesson={
                    isDone(lesson) ? { ...lesson, state: "completed" } : lesson
                  }
                  index={globalLessonIndex + lIdx}
                  isActive={lesson.id === activeLessonId}
                  isForceLockedBySection={locked}
                  onClick={onLessonClick}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
