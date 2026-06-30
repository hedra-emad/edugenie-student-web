// src/types/player.ts
export type LessonState = "locked" | "available" | "in_progress" | "completed";
export interface PlayerLesson {
  id: string;
  title: string;
  videoUrl: string;
  videoPublicId: string;
  videoDuration: number; // seconds
  state: LessonState;
  watchedDuration: number; // seconds already watched
  transcript?: string;
}

/** Why a section is locked: not bought, or the previous quiz isn't passed. */
export type SectionLockReason = "not_purchased" | "locked_progress" | null;

export interface PlayerSection {
  id: string;
  title: string;
  description: string;
  isOwned: boolean;
  /** Owned AND the previous owned section's quiz is passed (≥80%). */
  isUnlocked: boolean;
  /** This section has a quiz (so it gates the next section). */
  hasQuiz: boolean;
  lockReason: SectionLockReason;
  /** The section whose quiz must be passed to unlock this one. */
  requiredSectionId: string | null;
  requiredSectionTitle: string | null;
  isCompleted: boolean;
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
  /** Course progress (%) over the student's owned scope. */
  courseProgress?: number;
  /** Completed / total lessons within the owned scope. */
  completedLessons?: number;
  totalLessons?: number;
}

export interface Note {
  id: string;
  content: string;
  timestamp: number; // seconds into the video
  createdAt: string;
}
