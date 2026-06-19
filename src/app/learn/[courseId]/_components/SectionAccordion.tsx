"use client";
// _components/SectionAccordion.tsx

import { useState } from "react";
import Link from "next/link";
import type { PlayerSection, PlayerLesson } from "@/types/player";
import LessonItem from "./LessonItem";

interface Props {
  section: PlayerSection;
  courseId: string;
  activeLessonId: string;
  globalLessonIndex: number; // 1-based index of the first lesson in this section
  defaultOpen?: boolean;
  onLessonClick: (lesson: PlayerLesson) => void;
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
  activeLessonId,
  globalLessonIndex,
  defaultOpen = false,
  onLessonClick,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  const completedInSection = section.lessons.filter(
    (l) => l.state === "completed",
  ).length;

  return (
    <div className={`border-b border-slate-200 last:border-0`}>
      {/* Section header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left bg-slate-50
                   border-b border-slate-200 transition-colors focus:outline-none
                   focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#3B1892]
                   ${!section.isOwned ? "opacity-60" : ""}`}
        aria-expanded={open}
      >
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-1.5">
            <p className="text-[13px] font-bold text-slate-800 leading-snug">
              {section.title}
            </p>
            {!section.isOwned && <LockIcon />}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {section.lessons.length} lessons
            {section.lessons.length > 0 &&
              ` · ${formatSectionDuration(section.lessons)}`}
            {section.isOwned &&
              section.lessons.length > 0 &&
              ` · ${completedInSection}/${section.lessons.length} done`}
          </p>
        </div>

        <ChevronIcon open={open} />
      </button>

      {/* Lesson list */}
      {open && (
        <div>
          {!section.isOwned && (
            <div className="px-3 pb-3 border-t border-slate-200 bg-white">
              <p className="text-[12.5px] text-slate-500 px-1 pt-3">
                This section is not included in your enrollment.
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

          {section.lessons.map((lesson, lIdx) => (
            <div key={lesson.id} className={!section.isOwned ? "opacity-60" : ""}>
              <LessonItem
                lesson={lesson}
                index={globalLessonIndex + lIdx}
                isActive={lesson.id === activeLessonId}
                isForceLockedBySection={!section.isOwned}
                onClick={onLessonClick}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
