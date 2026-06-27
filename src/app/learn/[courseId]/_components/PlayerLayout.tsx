"use client";
// _components/PlayerLayout.tsx

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { PlayerCourse, PlayerLesson, ProgressResponse } from "@/types/player";

import PlayerHeader from "./PlayerHeader";
import VideoPlayer, { type VideoPlayerHandle } from "./VideoPlayer";
import LessonSidebar from "./LessonSidebar";
import TabBar from "./TabBar";
import AiTutorPanel from "./AiTutorPanel";

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
  const videoPlayerRef = useRef<VideoPlayerHandle>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      // Quiz redirect — immediate, no confirmation
      if (res.quizRequired && res.quizSectionId) {
        router.push(`/learn/${course.id}/quiz/${res.quizSectionId}`);
        return;
      }
      // Mark as completed
      if (res.lessonState === "completed") {
        setCompletedLessons((prev) => {
          const next = new Set(prev);
          next.add(activeLesson.id);
          return next;
        });
      }
    },
    [activeLesson.id, course.id, router],
  );

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
  const totalLessons = course.sections.reduce(
    (a, s) => a + s.lessons.length,
    0,
  );
  const completedCount = completedLessons.size;

  // Build nextLesson info for TabBar (needs duration)
  const nextLessonForTab = nextLesson
    ? {
        id: nextLesson.id,
        title: nextLesson.title,
        videoDuration: nextLesson.videoDuration,
      }
    : null;

  return (
    <div className="flex flex-col bg-slate-50">
      <PlayerHeader
        courseTitle={course.title}
        currentLessonTitle={activeLesson.title}
        completedLessons={completedCount}
        totalLessons={totalLessons}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        sidebarOpen={sidebarOpen}
      />

      <main className="flex-1 overflow-y-auto">
        {/* Top row — Video + AI Chatbot */}
        <div className="px-4 pt-4 pb-0 bg-slate-100">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 items-stretch">
            {/* Left — Video Player */}
            <div className="min-w-0 rounded-2xl overflow-hidden shadow-sm">
              <VideoPlayer
                ref={videoPlayerRef}
                lesson={activeLesson}
                courseId={course.id}
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

            {/* Right — AI Tutor Panel (lesson + course tiers, streams over /ai) */}
            <div className="self-stretch">
              <AiTutorPanel
                courseId={course.id}
                courseTitle={course.title}
                lessonId={activeLesson.id}
                lessonTitle={activeLesson.title}
              />
            </div>
          </div>
        </div>

        {/* Bottom row — Notes/Overview + Sections/Lessons */}
        <div className="px-4 py-4 bg-slate-100 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
          {/* Left — Notes and Overview */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden min-w-0 max-h-[400px] overflow-y-auto">
            <TabBar
              lesson={activeLesson}
              nextLesson={nextLessonForTab}
              getCurrentTime={getCurrentTime}
              onSeekTo={handleSeekTo}
              onNextLesson={handleNextLesson}
            />
          </div>

          {/* Right — Sections and Lessons (desktop) */}
          <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 overflow-hidden max-h-[400px] overflow-y-auto">
            <LessonSidebar
              course={course}
              activeLessonId={activeLesson.id}
              onLessonClick={handleLessonClick}
            />
          </div>

          {/* Sections and Lessons (mobile, stacked below notes) */}
          <div className="lg:hidden bg-white rounded-2xl border border-slate-200 overflow-hidden max-h-[320px] overflow-y-auto">
            <LessonSidebar
              course={course}
              activeLessonId={activeLesson.id}
              onLessonClick={handleLessonClick}
            />
          </div>
        </div>
      </main>

      {/* Mobile sidebar overlay (contents quick-access) */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex flex-col bg-white">
          <div className="h-14 flex items-center justify-between px-4 border-b border-slate-200 shrink-0">
            <p className="text-[14px] font-bold text-slate-800">Contents</p>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-xl
                         text-slate-500 hover:bg-slate-100 transition-colors"
              aria-label="Close contents"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <LessonSidebar
              course={course}
              activeLessonId={activeLesson.id}
              onLessonClick={handleLessonClick}
            />
          </div>
        </div>
      )}
    </div>
  );
}
