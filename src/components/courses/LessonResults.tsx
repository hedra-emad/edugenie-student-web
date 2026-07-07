'use client';
// Semantic lesson matches, grouped Course → Section → Lessons so names appear
// once. Each course is a collapsible accordion (expanded by default) showing its
// match count. Lessons show a timestamp chip: owned → deep-link into the player
// at that moment; unowned → static locked time (enroll to jump).

import { useState } from 'react';
import Link from 'next/link';
import type { LessonHit } from '@/lib/api/search';
import { formatTime } from '@/lib/format-time';

function TimeChip({ hit }: { hit: LessonHit }) {
  if (typeof hit.start !== 'number') return null;
  const label = formatTime(hit.start);

  if (hit.owned) {
    return (
      <Link
        href={`/learn/${hit.courseId}?lesson=${hit.lessonId}&t=${Math.floor(hit.start)}`}
        aria-label={`Open the lesson at ${label}`}
        className="flex shrink-0 items-center gap-1 rounded-md bg-[#3B1892] px-2 py-1 font-mono
                   text-[11px] font-bold tabular-nums text-white transition-colors hover:bg-[#2A1069]
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B1892] focus-visible:ring-offset-1"
      >
        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M8 5v14l11-7z" />
        </svg>
        {label}
      </Link>
    );
  }

  return (
    <span
      title="Enroll to jump to this moment"
      className="flex shrink-0 items-center gap-1 rounded-md bg-slate-100 px-2 py-1 font-mono
                 text-[11px] font-medium tabular-nums text-slate-400"
    >
      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </svg>
      {label}
    </span>
  );
}

interface SectionGroup {
  sectionTitle: string;
  lessons: LessonHit[];
}
interface CourseGroup {
  courseId: string;
  courseTitle: string;
  count: number;
  sections: SectionGroup[];
}

/** Fold the flat, relevance-ordered hits into Course → Section → Lessons,
 *  preserving first-seen (relevance) order at every level. */
function groupHits(hits: LessonHit[]): CourseGroup[] {
  const courses: CourseGroup[] = [];
  const courseIdx = new Map<string, number>();
  const sectionIdx = new Map<string, number>(); // key: `${courseId} ${sectionTitle}`

  for (const h of hits) {
    let ci = courseIdx.get(h.courseId);
    if (ci === undefined) {
      ci = courses.length;
      courseIdx.set(h.courseId, ci);
      courses.push({ courseId: h.courseId, courseTitle: h.courseTitle, count: 0, sections: [] });
    }
    const course = courses[ci];
    course.count += 1;
    const secKey = `${h.courseId} ${h.sectionTitle}`;
    let si = sectionIdx.get(secKey);
    if (si === undefined) {
      si = course.sections.length;
      sectionIdx.set(secKey, si);
      course.sections.push({ sectionTitle: h.sectionTitle, lessons: [] });
    }
    course.sections[si].lessons.push(h);
  }
  return courses;
}

export default function LessonResults({ hits }: { hits: LessonHit[] }) {
  const groups = groupHits(hits);
  // Expanded by default: every course open on first render.
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  if (!hits.length) return null;

  const toggle = (id: string) =>
    setCollapsed((c) => ({ ...c, [id]: !c[id] }));

  return (
    <div className="mb-7 rounded-2xl border border-violet-200 bg-violet-50/40 p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#3B1892] text-white">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <path d="m21 21-4.3-4.3M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z" />
          </svg>
        </span>
        <p className="text-[13.5px] font-bold text-slate-800">
          Lessons matching your search
        </p>
        <span className="ml-1 rounded-full bg-[#3B1892] px-2 py-0.5 text-[11px] font-bold tabular-nums text-white">
          {hits.length}
        </span>
      </div>

      <div className="space-y-3">
        {groups.map((course) => {
          const isOpen = !collapsed[course.courseId];
          const panelId = `lr-${course.courseId}`;
          return (
            <div
              key={course.courseId}
              className="overflow-hidden rounded-xl border border-violet-100 bg-white"
            >
              {/* Course header — accordion toggle + count + open-course link */}
              <div className="flex items-center gap-1 border-b border-slate-100 bg-slate-50/70">
                <button
                  type="button"
                  onClick={() => toggle(course.courseId)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className="flex min-w-0 flex-1 items-center gap-2 px-4 py-2.5 text-left
                             transition-colors hover:bg-violet-50/60 focus:outline-none
                             focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#3B1892]"
                >
                  <svg
                    className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                  <svg className="h-4 w-4 shrink-0 text-[#3B1892]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                  <span className="min-w-0 truncate text-[13px] font-bold text-slate-900">
                    {course.courseTitle || 'Course'}
                  </span>
                  <span className="shrink-0 rounded-full bg-violet-100 px-2 py-0.5 text-[10.5px] font-bold tabular-nums text-[#3B1892]">
                    {course.count}
                  </span>
                </button>
                <Link
                  href={`/courses/${course.courseId}`}
                  aria-label="Open course page"
                  className="mr-2 flex shrink-0 items-center rounded-md p-1.5 text-slate-400
                             transition-colors hover:bg-white hover:text-[#3B1892]
                             focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B1892]"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M7 17 17 7M7 7h10v10" />
                  </svg>
                </Link>
              </div>

              {/* Sections → lessons */}
              {isOpen && (
                <div id={panelId} className="divide-y divide-slate-50">
                  {course.sections.map((sec, i) => (
                    <div key={`${sec.sectionTitle}-${i}`} className="px-4 py-2.5">
                      {sec.sectionTitle && (
                        <p className="mb-1.5 text-[10.5px] font-bold uppercase tracking-wide text-slate-400">
                          {sec.sectionTitle}
                        </p>
                      )}
                      <ul className="space-y-1">
                        {sec.lessons.map((lesson) => (
                          <li
                            key={lesson.lessonId}
                            className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5
                                       transition-colors hover:bg-slate-50"
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-violet-300" aria-hidden />
                              <span className="min-w-0 truncate text-[13px] text-slate-700">
                                {lesson.lessonTitle || 'Lesson'}
                              </span>
                            </span>
                            <TimeChip hit={lesson} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
