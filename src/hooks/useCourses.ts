"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";

import { fetchAllCourses } from "@/lib/api/courses";
import {
  Course,
  CourseFilters,
  DEFAULT_FILTERS,
  SortOption,
  CourseLevel,
} from "@/types/course";

export const courseKeys = {
  all: ["courses", "all"] as const,
};

function parseFiltersFromUrl(params: URLSearchParams): CourseFilters {
  return {
    search: params.get("search") ?? DEFAULT_FILTERS.search,
    category: params.get("category") ?? DEFAULT_FILTERS.category,
    level: (params.get("level") ?? DEFAULT_FILTERS.level) as CourseLevel | "",
    minPrice: params.get("minPrice") ? Number(params.get("minPrice")) : "",
    maxPrice: params.get("maxPrice") ? Number(params.get("maxPrice")) : "",
    minRating: params.get("minRating") ? Number(params.get("minRating")) : "",
    maxDuration: params.get("maxDuration")
      ? Number(params.get("maxDuration"))
      : "",
    sort: (params.get("sort") ?? DEFAULT_FILTERS.sort) as SortOption,
    page: params.get("page") ? Number(params.get("page")) : 1,
    limit: DEFAULT_FILTERS.limit,
  };
}

function applyFilters(courses: Course[], filters: CourseFilters): Course[] {
  let result = [...courses];

  if (filters.search.trim()) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q),
    );
  }

  if (filters.category) {
    result = result.filter((c) => {
      const catId =
        typeof c.categoryId === "string" ? c.categoryId : c.categoryId?._id;
      return catId === filters.category;
    });
  }

  if (filters.level) {
    result = result.filter((c) => c.level === filters.level);
  }

  if (filters.minPrice !== "") {
    result = result.filter((c) => c.price >= (filters.minPrice as number));
  }

  if (filters.maxPrice !== "") {
    result = result.filter((c) => c.price <= (filters.maxPrice as number));
  }

  if (filters.minRating !== "") {
    result = result.filter(
      (c) => (c.ratingAverage ?? 0) >= (filters.minRating as number),
    );
  }

  if (filters.maxDuration !== "") {
    result = result.filter(
      (c) => (c.totalHours ?? 0) <= (filters.maxDuration as number),
    );
  }

  result.sort((a, b) => {
    switch (filters.sort) {
      case "newest":
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case "oldest":
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      case "price-asc":
        return a.price - b.price;
      case "price-desc":
        return b.price - a.price;
      case "rating":
        return (b.ratingAverage ?? 0) - (a.ratingAverage ?? 0);
      case "popular":
        return (b.totalEnrollments ?? 0) - (a.totalEnrollments ?? 0);
      default:
        return 0;
    }
  });

  return result;
}

export function useCourses() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(
    () => parseFiltersFromUrl(searchParams),
    [searchParams],
  );

  const query = useQuery({
    queryKey: courseKeys.all,
    queryFn: fetchAllCourses,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  const filteredCourses = useMemo(
    () => applyFilters(query.data ?? [], filters),
    [query.data, filters],
  );

  const { paginatedCourses, pagination } = useMemo(() => {
    const total = filteredCourses.length;
    const totalPages = Math.max(1, Math.ceil(total / filters.limit));
    const page = Math.min(filters.page, totalPages);
    const start = (page - 1) * filters.limit;

    return {
      paginatedCourses: filteredCourses.slice(start, start + filters.limit),
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: filters.limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }, [filteredCourses, filters.page, filters.limit]);

  const setFilters = useCallback(
    (updates: Partial<CourseFilters>) => {
      const next = new URLSearchParams(searchParams.toString());

      if (!("page" in updates)) next.set("page", "1");

      Object.entries(updates).forEach(([key, val]) => {
        if (val === "" || val === null || val === undefined) {
          next.delete(key);
        } else {
          next.set(key, String(val));
        }
      });

      const queryString = next.toString();
      router.push(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    },
    [router, pathname, searchParams],
  );

  const resetFilters = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [router, pathname]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.category) count++;
    if (filters.level) count++;
    if (filters.minPrice !== "") count++;
    if (filters.maxPrice !== "") count++;
    if (filters.minRating !== "") count++;
    if (filters.maxDuration !== "") count++;
    return count;
  }, [filters]);

  return {
    courses: paginatedCourses,
    pagination,
    filters,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    setFilters,
    resetFilters,
    activeFilterCount,
  };
}
