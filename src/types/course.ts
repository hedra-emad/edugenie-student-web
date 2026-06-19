//  Enums (Match ERD)

export type CourseLevel = "beginner" | "intermediate" | "advanced";
export type CourseStatus = "draft" | "published" | "archived";
export type SortOption =
  | "newest"
  | "oldest"
  | "price-asc"
  | "price-desc"
  | "rating"
  | "popular";

// ─── Core Entities

export interface Category {
  id: string;
  name?: string;
  slug: string;
}

export interface Instructor {
  id: string;
  name?: string; // optional
  avatar?: string;
  averageIntructorRating?: number;
}
export interface InstructorProfile {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
  averageIntructorRating?: number;
}
export interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  level: CourseLevel;
  thumbnail: string;
  goals?: string[];
  requirements?: string[];
  instructorId: Instructor;
  categoryId: Category;
  status: CourseStatus;
  ratingAverage?: number;
  totalLessons?: number;
  totalEnrollments?: number;
  totalVideos?: number;
  totalHours?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CourseDetails {
  id: string;
  title: string;
  description: string;
  price: number;
  thumbnail: string;
  level: CourseLevel;
  categoryId: Category;
  ratingAverage?: number;
  sections: Section[];
  instructor: InstructorProfile;
  isFullyOwned: boolean;
}
export interface Lesson {
  id: string;
  sectionId: string;
  title: string;
  videoDuration: number;
}

export interface Section {
  id: string;
  title: string;
  description?: string;
  expectedOutcomes?: string[];
  isBasicSection: boolean;
  totalHour?: number;
  price: number;
  lessons: Lesson[];
  isOwned: boolean;
}

// ─── API Response

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface CoursesApiResponse {
  success: boolean;
  data: Course[];
  pagination: PaginationMeta;
}

// ─── Filter State

export interface CourseFilters {
  search: string;
  category: string;
  level: CourseLevel | "";
  minPrice: number | "";
  maxPrice: number | "";
  minRating: number | "";
  maxDuration: number | "";
  sort: SortOption;
  page: number;
  limit: number;
}

export const DEFAULT_FILTERS: CourseFilters = {
  search: "",
  category: "",
  level: "",
  minPrice: "",
  maxPrice: "",
  minRating: "",
  maxDuration: "",
  sort: "newest",
  page: 1,
  limit: 9,
};
