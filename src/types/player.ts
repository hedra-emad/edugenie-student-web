// src/types/player.ts
export type LessonState = "locked" | "available" | "in_progress" | "completed";

/** Why a section is locked (mirrors backend `applyStudentAccess`). */
export type SectionLockReason = "not_purchased" | "locked_progress" | null;

/** One time-coded transcript segment (clickable → seek the player). */
export interface TranscriptSegment {
  start: number; // seconds into the video
  text: string;
}

export interface PlayerLesson {
  id: string;
  title: string;
  videoUrl: string;
  videoPublicId: string;
  videoDuration: number; // seconds
  state: LessonState;
  watchedDuration: number; // seconds already watched
  transcript?: string;
  /** Present only for time-coded transcripts; legacy lessons have text only. */
  transcriptSegments?: TranscriptSegment[];
}

export interface PlayerSection {
  id: string;
  title: string;
  description: string;
  isOwned: boolean;
  isCompleted: boolean;
  /** True when the student may open this section (owned AND previous gate passed). */
  isUnlocked: boolean;
  /** True when this section has an approved quiz that gates the next one. */
  hasQuiz: boolean;
  /** Why the section is locked, if it is. */
  lockReason: SectionLockReason;
  /** The section whose quiz must be passed to unlock this one (progress lock). */
  requiredSectionId: string | null;
  requiredSectionTitle: string | null;
  lessons: PlayerLesson[];
}

export interface PlayerCourse {
  id: string;
  title: string;
  thumbnail: string;
  totalLessons: number;
  sections: PlayerSection[];
}

export interface ResumeData {
  lessonId: string | null;
  sectionId: string | null;
  watchedDuration: number;
}

export interface ProgressPayload {
  lessonId: string;
  watchedDuration: number;
  isCompleted: boolean;
}

export interface ProgressResponse {
  lessonState: LessonState;
  nextLessonUnlocked: boolean;
  nextLesson: { id: string; title: string } | null;
  sectionCompleted: boolean;
  quizRequired: boolean;
  quizSectionId: string | null;
  /** Scope-aware course progress (%), when the backend returns it. */
  courseProgress?: number;
  /** Number of completed lessons within the student's owned scope. */
  completedLessons?: number;
  /** Total lessons within the student's owned scope. */
  totalLessons?: number;
}

export interface Note {
  id: string;
  content: string;
  timestamp: number; // seconds into the video
  createdAt: string;
}
