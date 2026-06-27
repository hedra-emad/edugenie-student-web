"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";

import { fetchCourses } from "@/lib/api/courses";
import {
  CourseFilters,
  DEFAULT_FILTERS,
  SortOption,
  CourseLevel,
} from "@/types/course";

export const courseKeys = {
  all: ["courses"] as const,
  list: (filters: CourseFilters) => ["courses", "list", filters] as const,
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

export function useCourses() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(
    () => parseFiltersFromUrl(searchParams),
    [searchParams],
  );

  // Server-side pagination + filtering: the backend does the work and returns
  // only the current page. keepPreviousData avoids a full-grid flash while the
  // next page/filter loads. The filters object is part of the query key, so any
  // change refetches the right slice.
  const query = useQuery({
    queryKey: courseKeys.list(filters),
    queryFn: () => fetchCourses(filters),
    staleTime: 1000 * 60 * 2,
    placeholderData: keepPreviousData,
    retry: 1,
  });

  const courses = query.data?.data ?? [];

  const pagination = query.data?.pagination ?? {
    currentPage: filters.page,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: filters.limit,
    hasNextPage: false,
    hasPrevPage: false,
  };

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
    courses,
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
