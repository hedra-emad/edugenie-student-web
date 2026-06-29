// _components/CourseCurriculum.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import type { Lesson, Section } from "../../../app/courses/[courseId]/types/course";
import PracticeQuizModal from "../../ai/PracticeQuizModal";
import { useCourseAccess } from "./CourseAccessProvider";

function getSectionId(section: Section) {
  return (section as Section & { id?: string }).id ?? section.id;
}

function getLessonId(lesson: Lesson) {
  return (lesson as Lesson & { id?: string }).id ?? lesson.id;
}

function formatSeconds(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

function formatSectionDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  return m >= 60
    ? `${Math.floor(m / 60)}h ${m % 60 > 0 ? `${m % 60}m` : ""}`
    : `${m}m`;
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

function LockIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-violet-600 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

interface Props {
  sections: Section[];
  courseId: string;
  courseTitle?: string;
}

export default function CourseCurriculum({
  sections,
  courseId,
  courseTitle,
}: Props) {
  const access = useCourseAccess();
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    () => (sections[0] ? getSectionId(sections[0]) : null),
  );
  const [quizSection, setQuizSection] = useState<{
    sectionId: string;
    label: string;
  } | null>(null);

  const toggle = (id: string) =>
    setSelectedSectionId((prev) => (prev === id ? null : id));

  const totalLessons  = sections.reduce((a, s) => a + s.lessons.length, 0);
  const totalDuration = sections.reduce(
    (a, s) => a + s.lessons.reduce((b, l) => b + l.videoDuration, 0),
    0
  );

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-6">

      {/* Header */}
      <h2 className="text-[15px] font-bold text-slate-900 mb-1">Course Curriculum</h2>
      <p className="text-[12.5px] text-slate-400 mb-5">
        {sections.length} sections · {totalLessons} lessons ·{" "}
        {formatSectionDuration(totalDuration)} total
      </p>

      <div className="flex flex-col gap-2">
        {sections.map((section, sIdx) => {
          const sectionId = getSectionId(section);
          const isOpen = selectedSectionId === sectionId;
          const secDuration = section.lessons.reduce((a, l) => a + l.videoDuration, 0);
          const owned =
            access.isFullyOwned || access.ownedSectionIds.has(sectionId);

          return (
            <div
              key={sectionId}
              className="border border-slate-200 rounded-xl overflow-hidden"
            >
              {/* Section header */}
              <button
                onClick={() => toggle(sectionId)}
                className="
                  w-full flex items-center gap-3 px-4 py-3.5 text-left
                  bg-slate-50 hover:bg-slate-100
                  transition-colors duration-150
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500
                "
              >
                <ChevronIcon open={isOpen} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold text-violet-600 uppercase tracking-wide">
                      Section {sIdx + 1}
                    </span>
                    {section.isBasicSection && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
                        Basics
                      </span>
                    )}
                    {owned && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                        Owned
                      </span>
                    )}
                  </div>
                  <p className="text-[13.5px] font-semibold text-slate-800 mt-0.5 leading-tight">
                    {section.title}
                  </p>
                </div>
                

                <div className="flex items-center gap-3 flex-shrink-0 text-[11.5px] text-slate-400">
                  <span>{section.lessons.length} lessons</span>
                  {secDuration > 0 && <span>{formatSectionDuration(secDuration)}</span>}
                </div>
              </button>

              {/* Lessons */}
              {isOpen && (
                <div className="divide-y divide-slate-100">
                  {section.description && (
      <div className="px-4 py-3">
        <p className="text-[13px] text-slate-500 leading-relaxed">
          {section.description}
        </p>
      </div>
    )}
                  {section.lessons.length === 0 ? (
                    <p className="px-4 py-3 text-[12.5px] text-slate-400 italic">
                      No lessons yet.
                    </p>
                  ) : (
                    section.lessons.map((lesson, lIdx) => {
                      const isLocked = !owned;
                      const rowClass = `flex items-center gap-3 px-4 py-3 transition-colors ${
                        isLocked
                          ? "opacity-55 cursor-default"
                          : "hover:bg-slate-50 cursor-pointer"
                      }`;
                      const inner = (
                        <>
                          {/* Icon */}
                          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                            {isLocked ? <LockIcon /> : <PlayIcon />}
                          </div>

                          {/* Title */}
                          <p className={`flex-1 text-[13px] leading-snug line-clamp-1 ${
                            isLocked ? "text-slate-500" : "text-slate-800 font-medium"
                          }`}>
                            {lIdx + 1}. {lesson.title}
                          </p>

                          {/* Duration */}
                          {lesson.videoDuration > 0 && (
                            <span className="text-[11px] text-slate-400 tabular-nums flex-shrink-0">
                              {formatSeconds(lesson.videoDuration)}
                            </span>
                          )}
                        </>
                      );

                      // Owned lessons link straight into the player.
                      return isLocked ? (
                        <div key={getLessonId(lesson)} className={rowClass}>
                          {inner}
                        </div>
                      ) : (
                        <Link
                          key={getLessonId(lesson)}
                          href={`/learn/${courseId}`}
                          className={rowClass}
                        >
                          {inner}
                        </Link>
                      );
                    })
                  )}
                  {owned && section.lessons.length > 0 && (
                    <div className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() =>
                          setQuizSection({
                            sectionId,
                            label: `${courseTitle ? `${courseTitle} › ` : ""}${section.title}`,
                          })
                        }
                        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#3B1892]/30 bg-violet-50 px-3 py-2 text-[12px] font-bold text-[#3B1892] transition-colors hover:bg-violet-100"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
                        </svg>
                        Quiz me on this section
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {quizSection && (
        <PracticeQuizModal
          sectionId={quizSection.sectionId}
          label={quizSection.label}
          onClose={() => setQuizSection(null)}
        />
      )}
    </section>
  );
}