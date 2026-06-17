// types/course.ts

export interface Lesson {
  _id: string;
  title: string;
  videoUrl: string;
  videoPublicId: string;
  videoDuration: number; // seconds
  createdAt: string;
  updatedAt: string;
}

export interface Section {
  _id: string;
  title: string;
  description: string;
  expectedOutcomes: string[];
  isBasicSection: boolean;
  lessons: Lesson[];
  createdAt: string;
  updatedAt: string;
}

export interface Instructor {
  _id: string;
  firstName: string;
  lastName: string;
  avatar: string;
}

export interface Category {
  _id: string;
  name: string;
  iconUrl: string;
  slug: string;
}

export interface Course {
  _id: string;
  title: string;
  description: string;
  price: number;
  thumbnail: string;
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