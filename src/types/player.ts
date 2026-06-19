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

export interface PlayerSection {
  id: string;
  title: string;
  description: string;
  isOwned: boolean;
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
}

export interface Note {
  id: string;
  content: string;
  timestamp: number; // seconds into the video
  createdAt: string;
}
