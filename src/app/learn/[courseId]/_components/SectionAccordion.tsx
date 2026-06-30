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
  /** Live set of completed lesson ids. */
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
    <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
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

  const isDone = (l: PlayerLesson) =>
    l.state === "completed" || (completedLessons?.has(l.id) ?? false);

  const completedInSection = section.lessons.filter(isDone).length;

  // Two distinct lock reasons drive different UI (and copy).
  const notPurchased = section.lockReason === "not_purchased" || !section.isOwned;
  const progressLocked =
    section.isOwned && section.lockReason === "locked_progress";
  const locked = !section.isUnlocked;

  return (
    <div className={`border-b border-slate-200 last:border-0`}>
      {/* Section header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left bg-slate-50
                   border-b border-slate-200 transition-colors focus:outline-none
                   focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#3B1892]
                   ${locked ? "opacity-60" : ""}`}
        aria-expanded={open}
      >
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-1.5">
            <p className="text-[13px] font-bold text-slate-800 leading-snug">
              {section.title}
            </p>
            {locked && <LockIcon />}
          </div>
          <p className="text-[11px] mt-0.5 flex items-center gap-1.5">
            <span className="text-slate-400">
              {section.lessons.length} lessons
              {section.lessons.length > 0 &&
                ` · ${formatSectionDuration(section.lessons)}`}
              {section.isUnlocked &&
                section.lessons.length > 0 &&
                ` · ${completedInSection}/${section.lessons.length} done`}
            </span>
            {notPurchased && (
              <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                Not purchased
              </span>
            )}
            {progressLocked && (
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                Locked · pass previous quiz
              </span>
            )}
          </p>
        </div>

        <ChevronIcon open={open} />
      </button>

      {/* Lesson list */}
      {open && (
        <div>
          {/* Unlocked: take the graded quiz (unlocks next) + optional AI practice */}
          {section.isUnlocked && section.lessons.length > 0 && (
            <div className="space-y-2 px-3 pt-3 bg-white">
              {section.hasQuiz && (
                <Link
                  href={`/learn/${courseId}/quiz/${section.id}`}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg
                             bg-[#3B1892] px-3 py-2 text-[12px] font-bold text-white
                             transition-colors hover:bg-[#2A1069]"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 11l3 3L22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
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
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#3B1892]/30
                           bg-violet-50 px-3 py-2 text-[12px] font-bold text-[#3B1892]
                           transition-colors hover:bg-violet-100"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
                </svg>
                Practice (ungraded)
              </button>
            </div>
          )}

          {/* Locked because not purchased */}
          {notPurchased && (
            <div className="px-3 pb-3 border-t border-slate-200 bg-white">
              <p className="text-[12.5px] text-slate-500 px-1 pt-3">
                This section isn&apos;t included in your enrollment. Buy it to
                watch the lessons and take its quiz.
              </p>
              <Link
                href={`/courses/${courseId}`}
                className="block w-full text-center mt-2 border border-[#3B1892] text-[#3B1892]
                           text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-violet-50 transition-colors"
              >
                Buy this section
              </Link>
            </div>
          )}

          {/* Locked because the previous section's quiz isn't passed yet */}
          {progressLocked && (
            <div className="px-3 pb-3 border-t border-amber-200 bg-amber-50/40">
              <p className="text-[12.5px] text-amber-800 px-1 pt-3">
                You own this section, but it unlocks once you pass
                {section.requiredSectionTitle
                  ? ` the “${section.requiredSectionTitle}”`
                  : " the previous"}{" "}
                quiz at <span className="font-semibold">80%</span>.
              </p>
              {section.requiredSectionId && (
                <Link
                  href={`/learn/${courseId}/quiz/${section.requiredSectionId}`}
                  className="block w-full text-center mt-2 bg-amber-500 text-white
                             text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-amber-600 transition-colors"
                >
                  Go to that quiz
                </Link>
              )}
            </div>
          )}

          {section.lessons.map((lesson, lIdx) => (
            <div key={lesson.id} className={locked ? "opacity-60" : ""}>
              <LessonItem
                lesson={
                  isDone(lesson) && lesson.state !== "completed"
                    ? { ...lesson, state: "completed" }
                    : lesson
                }
                index={globalLessonIndex + lIdx}
                isActive={lesson.id === activeLessonId}
                isForceLockedBySection={locked}
                onClick={onLessonClick}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
