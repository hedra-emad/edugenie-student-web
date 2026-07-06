"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchMyCertificates } from "@/lib/api/certificates";

export function useCertificates() {
  return useQuery({
    queryKey: ["certificates"],
    queryFn: fetchMyCertificates,
    staleTime: 1000 * 60 * 5, // 5 min
  });
}
