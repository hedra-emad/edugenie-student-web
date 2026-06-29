"use client";
// _components/LessonSidebar.tsx

import type { PlayerCourse, PlayerLesson } from "@/types/player";
import SectionAccordion from "./SectionAccordion";

interface Props {
  course: PlayerCourse;
  activeLessonId: string;
  onLessonClick: (lesson: PlayerLesson) => void;
  onQuizSection: (sectionId: string, label: string) => void;
}

/** Skeleton for the sidebar while loading */
export function LessonSidebarSkeleton() {
  return (
    <aside className="w-full bg-white flex flex-col">
      <div className="px-4 py-3 border-b border-slate-200">
        <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="px-4 py-4 flex flex-col gap-2">
            <div className="h-3.5 w-3/4 bg-slate-100 rounded animate-pulse" />
            <div className="h-2.5 w-1/2 bg-slate-100 rounded animate-pulse" />
            <div className="mt-2 space-y-2">
              {Array.from({ length: 3 }).map((_, j) => (
                <div
                  key={j}
                  className="h-3 bg-slate-100 rounded animate-pulse"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

export default function LessonSidebar({
  course,
  activeLessonId,
  onLessonClick,
  onQuizSection,
}: Props) {
  const totalLessons = course.sections.reduce(
    (a, s) => a + s.lessons.length,
    0,
  );

  const completedLessons = course.sections.reduce(
    (a, s) => a + s.lessons.filter((l) => l.state === "completed").length,
    0,
  );

  const activeSectionId = course.sections.find((s) =>
    s.lessons.some((l) => l.id === activeLessonId),
  )?.id;

  const sectionStartIndexes = course.sections.map((_, index) => {
    return (
      1 +
      course.sections
        .slice(0, index)
        .reduce((total, section) => total + section.lessons.length, 0)
    );
  });

  return (
    <aside className="w-full bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 flex-shrink-0">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
          Course Contents
        </p>
        <p className="text-xs text-slate-500 mt-0.5">
          {completedLessons} of {totalLessons} lessons complete
        </p>
      </div>

      {/* Scrollable lesson list */}
      <div className="flex-1 overflow-y-auto">
        {course.sections.map((section, index) => (
          <SectionAccordion
            key={section.id}
            section={section}
            courseId={course.id}
            courseTitle={course.title}
            activeLessonId={activeLessonId}
            globalLessonIndex={sectionStartIndexes[index]}
            defaultOpen={section.id === activeSectionId}
            onLessonClick={onLessonClick}
            onQuizSection={onQuizSection}
          />
        ))}
      </div>
    </aside>
  );
}
