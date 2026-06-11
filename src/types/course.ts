// ─── Enums (مطابقة الـ ERD)

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
  _id: string;
  name?: string;
  slug: string;
}

export interface Instructor {
  _id: string;
  name?: string; // optional — مش دايماً بييجي
  avatar?: string;
  averageIntructorRating?: number;
}

export interface Course {
  _id: string;
  title: string;
  description: string;
  price: number;
  level: CourseLevel;
  thumbnail: string;
  goals?: string[];
  requirements?: string[];
  instructorId: Instructor;
  categoryId: Category;
  courseStatus: CourseStatus;
  ratingAverage?: number;
  totalLessons?: number;
  totalEnrollments?: number;
  totalVideos?: number;
  totalHours?: number;
  createdAt: string;
  updatedAt: string;
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
