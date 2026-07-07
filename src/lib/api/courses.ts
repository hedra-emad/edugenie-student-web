import { Course, CourseFilters, CoursesApiResponse } from "@/types/course";
import { resolveApiBase } from "@/lib/apiBase";
// import { log } from "util";

const REMOTE_API_URL =
  process.env.NESTJS_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://edugenie-api.vercel.app";

const SERVER_API_URL = resolveApiBase(REMOTE_API_URL);
const BASE_URL = typeof window === "undefined" ? SERVER_API_URL : "/api/proxy";
// ─── Build query string from filters

export function buildCoursesQuery(filters: CourseFilters): string {
  const params = new URLSearchParams();
  // console.log(filters.page)
  if (filters.search) params.set("search", filters.search);
  if (filters.category) params.set("category", filters.category);
  if (filters.level) params.set("level", filters.level);
  if (filters.minPrice !== "") params.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice !== "") params.set("maxPrice", String(filters.maxPrice));
  if (filters.minRating !== "")
    params.set("minRating", String(filters.minRating));
  if (filters.maxDuration !== "")
    params.set("maxDuration", String(filters.maxDuration));
  if (filters.sort) params.set("sort", filters.sort);

  const limit = filters.limit || 10;
  const page = filters.page || 1;
  const skip = (page - 1) * limit;

  params.set("skip", String(skip));
  params.set("limit", String(limit));

  return params.toString();
}

// ─── Fetch courses (called from TanStack Query)
// Cookies are sent automatically by the browser — credentials: "include"

export async function fetchCourses(
  filters: CourseFilters,
): Promise<CoursesApiResponse> {
  const query = buildCoursesQuery(filters);
  const url = `${BASE_URL}/courses?${query}`;

  const res = await fetch(url, {
    credentials: "include", // sends cookies automatically
    headers: { "Content-Type": "application/json" },
    cache: "no-store", // always fresh — filtered data
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(
      (error as { message?: string }).message ??
      `Request failed: ${res.status}`,
    );
  }
  const json = await res.json();
  // API returns metadata: { data: { data: [...], meta: { page, total, limit, totalPages, hasNextPage, hasPrevPage } } }
  const meta = json?.data?.meta || {};
  const total = meta.total ?? json.data?.data?.length ?? 0;
  const limit = meta.limit ?? filters.limit ?? 10;
  const currentPage = meta.page ?? filters.page ?? 1;
  const totalPages = meta.totalPages ?? Math.ceil(total / limit);

  return {
    success: json.success ?? true,
    data: json?.data?.data ?? [],
    pagination: {
      currentPage,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage: meta.hasNextPage ?? (currentPage < totalPages),
      hasPrevPage: meta.hasPrevPage ?? (currentPage > 1),
    },
  };
}

// ─── Fetch categories for filter dropdown

export interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

export async function fetchCategories(): Promise<CategoryOption[]> {
  const res = await fetch(`${BASE_URL}/categories`, {
    credentials: "include",
    next: { revalidate: 3600 }, // cache 1 hour — categories rarely change
  });

  if (!res.ok) return [];

  const json = (await res.json()) as {
    data?: CategoryOption[];
    success?: boolean;
  };
  return json.data ?? [];
}
/**
 * Featured courses for the public home page. This is public data (published
 * courses, identical for every visitor) so it is fetched server-side WITHOUT
 * auth and cached with ISR — no per-user variance, no 1000-row over-fetch.
 */
export async function fetchCoursesForHome(limit = 9): Promise<Course[]> {
  const url = `${SERVER_API_URL}/courses?skip=0&limit=${limit}`;

  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    next: { revalidate: 300 }, // public list — revalidate every 5 min
  });

  if (!res.ok) return [];

  const json = await res.json();
  return (json?.data?.data ?? []) as Course[];
}
