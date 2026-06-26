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
  if (filters.category) params.set("categoryId", filters.category);
  if (filters.level) params.set("level", filters.level);
  if (filters.minPrice !== "") params.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice !== "") params.set("maxPrice", String(filters.maxPrice));
  // minRating, maxDuration, and sort are intentionally dropped as they are not supported by the backend findAll endpoint yet.

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
export async function fetchAllCourses(): Promise<Course[]> {
  const url = `${BASE_URL}/courses?skip=0&limit=1000`;
  // console.log("REQUEST URL:", url);
  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  // ----------
  // console.log("URL:", url);
  // console.log("STATUS:", res.status);

  // const text = await res.text();
  // console.log("RESPONSE:", text);
  // // --------

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(
      (error as { message?: string }).message ??
      `Request failed: ${res.status}`,
    );
  }

  const json = await res.json();
  return json?.data?.data ?? [];
}

/**
 * Shared fetch used by both the home page and the all-courses page.
 * Slicing to a limit is the call-site's responsibility — keep this generic.
 */
export async function fetchCoursesForHome(token?: string): Promise<Course[]> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const url = `${SERVER_API_URL}/courses?skip=0&limit=1000`;

  const res = await fetch(url, {
    headers,
    credentials: token ? undefined : "include",
    cache: "no-store",
  });

  if (!res.ok) return [];

  const json = await res.json();
  return (json?.data?.data ?? []) as Course[];
}
