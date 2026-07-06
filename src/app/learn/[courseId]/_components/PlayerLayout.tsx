"use client";
// _components/PlayerLayout.tsx

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import type { PlayerCourse, PlayerLesson, ProgressResponse } from "@/types/player";
import { useCertificates } from "@/hooks/useCertificates";

import Button from "@/components/ui/Button";
import PlayerHeader from "./PlayerHeader";
import VideoPlayer, { type VideoPlayerHandle } from "./VideoPlayer";
import LessonSidebar from "./LessonSidebar";
import TabBar from "./TabBar";
import AiTutorPanel from "./AiTutorPanel";
import PracticeQuizModal from "@/components/ai/PracticeQuizModal";

interface Props {
  course: PlayerCourse;
  initialLessonId: string;
  initialWatchedDuration: number;
}

export default function PlayerLayout({
  course,
  initialLessonId,
  initialWatchedDuration,
}: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const videoPlayerRef = useRef<VideoPlayerHandle>(null);

  // Certificates are issued (server-side) ONLY for full-course completions. The
  // header's certificate button reflects a real earned certificate for THIS
  // course — never just 100% of an owned section scope.
  const { data: certificates } = useCertificates();
  const certificateId = certificates?.find(
    (c) => c.courseId === course.id,
  )?.id;
  // Sections we've already auto-redirected to their quiz (once each).
  const quizRedirectedRef = useRef<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rightTab, setRightTab] = useState<"content" | "ai" | "transcript">("content");
  const [quizSection, setQuizSection] = useState<{
    sectionId: string;
    label: string;
  } | null>(null);
  const openQuiz = useCallback(
    (sectionId: string, label: string) => setQuizSection({ sectionId, label }),
    [],
  );

  // ── Active lesson state ───────────────────────────────────────────────────
  const findLesson = useCallback(
    (lessonId: string): PlayerLesson | null => {
      for (const section of course.sections) {
        const found = section.lessons.find((l) => l.id === lessonId);
        if (found) return found;
      }
      return null;
    },
    [course.sections],
  );

  const initialLesson = findLesson(initialLessonId) ?? course.sections[0]?.lessons[0];
  const [activeLesson, setActiveLesson] = useState<PlayerLesson>(() => {
    const lesson = initialLesson;
    if (lesson && initialWatchedDuration > 0) {
      return { ...lesson, watchedDuration: initialWatchedDuration };
    }
    return lesson;
  });

  // ── Progress / completion tracking ────────────────────────────────────────
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const section of course.sections) {
      for (const lesson of section.lessons) {
        if (lesson.state === "completed") initial.add(lesson.id);
      }
    }
    return initial;
  });

const handleProgressResponse = useCallback(
  (res: ProgressResponse) => {
    // Mark lesson as completed
    if (res.lessonState === "completed") {
      setCompletedLessons((prev) => {
        const next = new Set(prev);
        next.add(activeLesson.id);
        return next;
      });

      // Refetch certificates after completing a lesson
      queryClient.invalidateQueries({
        queryKey: ["certificates"],
      });
    }

    // Redirect to section quiz only once
    if (res.quizRequired && res.quizSectionId) {
      if (!quizRedirectedRef.current.has(res.quizSectionId)) {
        quizRedirectedRef.current.add(res.quizSectionId);

        router.push(
          `/learn/${course.id}/quiz/${res.quizSectionId}`
        );
      }

      return;
    }
  },
  [
    activeLesson.id,
    course.id,
    router,
    queryClient,
  ]
);
//   const handleProgressResponse = useCallback(
//     (res: ProgressResponse) => {
//       // Record the completion FIRST. The old code redirected to the quiz and
//       // returned *before* this ran, so at the moment the quiz decision was made
//       // the just-finished lesson wasn't yet counted as complete.
//       const justCompletedActive = res.lessonState === "completed";
//       if (justCompletedActive) {
//       // Quiz redirect — fires only after the whole section's lessons are done
//       // (backend gate) and only ONCE per section, so replaying a finished
//       // lesson doesn't keep bouncing the student into the quiz.
//       if (res.quizRequired && res.quizSectionId) {
//         if (!quizRedirectedRef.current.has(res.quizSectionId)) {
//           quizRedirectedRef.current.add(res.quizSectionId);
//           router.push(`/learn/${course.id}/quiz/${res.quizSectionId}`);
//         }
//         return;
//       }
//       // Mark as completed
//       if (res.lessonState === "completed") {
//         setCompletedLessons((prev) => {
//           const next = new Set(prev);
//           next.add(activeLesson.id);
//           return next;
//         });
//         // Finishing a lesson may be the event that issues the certificate
//         // (full-course, all lessons + quizzes done) — refetch so the header
//         // button appears only once the credential actually exists.
//         queryClient.invalidateQueries({ queryKey: ["certificates"] });
//       }

    
// if (res.quizRequired && res.quizSectionId) {
//     if (!quizRedirectedRef.current.has(res.quizSectionId)) {
//         quizRedirectedRef.current.add(res.quizSectionId);
//         router.push(...);
//     }
//     return;
// }
//   [
//   activeLesson.id,
//   course.id,
//   router,
//   queryClient,
// ]
//   );

  // ── Lesson navigation ─────────────────────────────────────────────────────
  const handleLessonClick = useCallback(
    (lesson: PlayerLesson) => {
      setActiveLesson(lesson);
      setSidebarOpen(false); // close mobile sidebar on selection
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [],
  );

  // Find next available/completed lesson after the active one
  const nextLesson = (() => {
    const allLessons = course.sections.flatMap((s) =>
      s.isOwned ? s.lessons : [],
    );
    const idx = allLessons.findIndex((l) => l.id === activeLesson.id);
    if (idx === -1) return null;
    const candidate = allLessons[idx + 1];
    if (!candidate) return null;
    if (candidate.state === "locked") return null;
    return candidate;
  })();

  const handleNextLesson = () => {
    if (nextLesson) handleLessonClick(nextLesson);
  };

  // ── Video player imperative helpers ──────────────────────────────────────
  const getCurrentTime = useCallback(
    () => videoPlayerRef.current?.getCurrentTime() ?? 0,
    [],
  );

  const handleSeekTo = useCallback((seconds: number) => {
    videoPlayerRef.current?.seekTo(seconds);
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────
  // Scope-aware: only owned sections count toward the header progress.
  const totalLessons = course.sections.reduce(
    (a, s) => a + (s.isOwned ? s.lessons.length : 0),
    0,
  );

  // Same entitlement check the sidebar already uses to render the lock icon /
  // "Not purchased" state (SectionAccordion/LessonItem: a lesson is locked
  // when its section isn't unlocked, or the lesson itself came back "locked"
  // from the backend's `applyStudentAccess`). `section.isUnlocked` already
  // covers BOTH direct-purchase and roadmap-enrollment access grants, so this
  // one check blocks playback consistently for either reason — no new/second
  // entitlement source introduced here.
  const activeSection = course.sections.find((s) =>
    s.lessons.some((l) => l.id === activeLesson.id),
  );
  const isActiveLessonLocked =
    !activeSection?.isUnlocked || activeLesson.state === "locked";
  // Same "not purchased" check SectionAccordion uses to gate lesson content.
  const activeSectionNotPurchased =
    !activeSection?.isOwned || activeSection?.lockReason === "not_purchased";
  const completedCount = completedLessons.size;

  // Build nextLesson info for TabBar (needs duration)
  const nextLessonForTab = nextLesson
    ? {
        id: nextLesson.id,
        title: nextLesson.title,
        videoDuration: nextLesson.videoDuration,
      }
    : null;

  // Shared locked state for the AI Tutor / Transcript tabs — same copy and
  // "Buy this section" CTA SectionAccordion already uses for not-purchased sections.
  const notPurchasedPanel = (
    <div className="h-full overflow-y-auto px-4 py-6 flex flex-col items-center text-center">
      <p className="text-[12.5px] text-slate-500">
        This section isn’t included in your enrollment.
      </p>
      <Link
        href={`/courses/${course.id}`}
        className="mt-3 inline-block rounded-lg border border-[#3B1892] px-4 py-2 text-xs font-bold text-[#3B1892] transition-colors hover:bg-violet-50"
      >
        Buy this section
      </Link>
    </div>
  );

  return (
    <div className="flex flex-col bg-slate-50">
      <PlayerHeader
        courseId={course.id}
        courseTitle={course.title}
        currentLessonTitle={activeLesson.title}
        completedLessons={completedCount}
        totalLessons={totalLessons}
        certificateId={certificateId}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        sidebarOpen={sidebarOpen}
      />

      <main className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-4 bg-slate-100 p-4">
          {/* Left column — Video on top, TabBar below */}
          <div className="flex flex-col gap-4 overflow-hidden min-w-0">
            {/* Video */}
            <div className="shrink-0 rounded-lg overflow-hidden">
              <VideoPlayer
                ref={videoPlayerRef}
                lesson={activeLesson}
                courseId={course.id}
                locked={isActiveLessonLocked}
                courseThumbnail={course.thumbnail}
                onProgressResponse={handleProgressResponse}
                onLessonComplete={() => {
                  setCompletedLessons((prev) => {
                    const next = new Set(prev);
                    next.add(activeLesson.id);
                    return next;
                  });
                }}
              />
            </div>

            {/* TabBar — fills remaining left column height */}
            <div className="flex-1 overflow-hidden bg-white rounded-lg">
              <TabBar
                lesson={activeLesson}
                nextLesson={nextLessonForTab}
                getCurrentTime={getCurrentTime}
                onSeekTo={handleSeekTo}
                onNextLesson={handleNextLesson}
              />
            </div>
          </div>

          {/* Right column — Course Content / AI Tutor / Transcript tabs, full height */}
          <div className="hidden lg:flex flex-col h-full bg-white overflow-hidden rounded-lg">
            {/* Tab strip */}
            <div className="flex shrink-0 border-b border-slate-200">
              {[
                { id: "content", label: "Course Content" },
                { id: "ai", label: "AI Tutor" },
                { id: "transcript", label: "Transcript" },
              ].map((tab) => {
                const isLockedTab = tab.id !== "content" && activeSectionNotPurchased;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setRightTab(tab.id as typeof rightTab)}
                    className={`flex-1 px-3 py-3 text-[12px] font-semibold transition-colors focus:outline-none
                      ${rightTab === tab.id
                        ? "border-b-2 border-[#3B1892] text-[#3B1892]"
                        : isLockedTab
                          ? "text-slate-400 opacity-70"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                  >
                    {tab.label}
                    {isLockedTab && (
                      <svg className="w-3 h-3 text-slate-400 flex-shrink-0 inline ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <rect x="5" y="11" width="14" height="10" rx="2" />
                        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab content — fills remaining height */}
            <div className="flex-1 overflow-hidden">
              {rightTab === "content" && (
                <LessonSidebar
                  course={course}
                  activeLessonId={activeLesson.id}
                  completedLessons={completedLessons}
                  onLessonClick={handleLessonClick}
                  onQuizSection={openQuiz}
                />
              )}
              {rightTab === "ai" && (
                activeSectionNotPurchased ? (
                  notPurchasedPanel
                ) : (
                  <AiTutorPanel
                    courseId={course.id}
                    courseTitle={course.title}
                    lessonId={activeLesson.id}
                    lessonTitle={activeLesson.title}
                  />
                )
              )}
              {rightTab === "transcript" && (
                activeSectionNotPurchased ? (
                  notPurchasedPanel
                ) : (
                  <div className="h-full overflow-y-auto px-4 py-4">
                    {activeLesson.transcript ? (
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {activeLesson.transcript}
                      </p>
                    ) : (
                      <p className="text-sm text-slate-400 text-center mt-8">
                        No transcript available for this lesson.
                      </p>
                    )}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Mobile sidebar overlay (contents quick-access) */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex flex-col bg-white">
          <div className="h-14 flex items-center justify-between px-4 border-b border-slate-200 shrink-0">
            <p className="text-[14px] font-bold text-slate-800">Contents</p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close contents"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <LessonSidebar
              course={course}
              activeLessonId={activeLesson.id}
              completedLessons={completedLessons}
              onLessonClick={handleLessonClick}
              onQuizSection={openQuiz}
            />
          </div>
        </div>
      )}

      {/* Targeted "Quiz Me" practice for a section */}
      {quizSection && (
        <PracticeQuizModal
          sectionId={quizSection.sectionId}
          label={quizSection.label}
          onClose={() => setQuizSection(null)}
        />
      )}
    </div>
  );
}
