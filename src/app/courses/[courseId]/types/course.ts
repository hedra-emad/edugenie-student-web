// types/course.ts

export interface Lesson {
  id: string;
  title: string;
  videoUrl: string;
  videoPublicId: string;
  videoDuration: number; // seconds
  createdAt: string;
  updatedAt: string;
}

export interface Section {
  id: string;
  title: string;
  description: string;
  expectedOutcomes: string[];
  isBasicSection: boolean;
  lessons: Lesson[];
  createdAt: string;
  updatedAt: string;
}

export interface Instructor {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string;
}

export interface Category {
  id: string;
  name: string;
  iconUrl: string;
  slug: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  thumbnail: string;
  previewVideoUrl: string | null;
  level: "beginner" | "intermediate" | "advanced";
  courseStatus: string;
  instructorId: Instructor;
  categoryId: Category;
  goals: string[];
  requirements: string[];
  ratingAverage: number;
  totalEnrollments: number;
  totalLessons: number;
  totalVideos: number;
  totalHours: number;
  sections: Section[];
  createdAt: string;
  updatedAt: string;
  // injected client-side after auth check
  isEnrolled?: boolean;
}