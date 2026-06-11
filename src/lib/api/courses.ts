import { Course, CourseFilters, CoursesApiResponse } from "@/types/course";
// import { log } from "util";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://edugenie-api.vercel.app";

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

  params.set("page", String(filters.page));
  params.set("limit", String(filters.limit));

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
  //  API بيرجع: { data, total, skip, limit }
  //  احنا بنبني pagination منهم
  const total = json.total ?? json.data?.length ?? 0;
  const limit = json.limit ?? filters.limit;
  // const skip        = json.skip    ?? 0;
  // const currentPage = Math.floor(skip / limit) + 1;
  const currentPage = json.currentPage ?? filters.page ?? 1;
  const totalPages = Math.ceil(total / limit);

  return {
    success: json.success ?? true,
    data: json.data ?? [],
    pagination: {
      currentPage,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
    },
  };
}

// ─── Fetch categories for filter dropdown

export interface CategoryOption {
  _id: string;
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
  const url = `${BASE_URL}/courses?page=1&limit=1000`;

  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(
      (error as { message?: string }).message ??
        `Request failed: ${res.status}`,
    );
  }

  const json = await res.json();
  return json.data ?? [];
}
