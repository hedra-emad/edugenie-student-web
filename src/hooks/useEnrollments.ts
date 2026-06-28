"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchMyEnrollments } from "@/lib/api/enrollments";

export function useEnrollments() {
  return useQuery({
    queryKey: ["enrollments", "my-courses"],
    queryFn: fetchMyEnrollments,
    staleTime: 1000 * 60 * 5, // 5 min
  });
}
