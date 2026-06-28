import type { EnrolledCourse } from "@/types/profile.types";

function getBaseUrl(): string {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_API_URL ?? "";
  }
  return process.env.NEXT_PUBLIC_API_BASE ?? "/api/proxy";
}

export async function fetchMyEnrollments(): Promise<EnrolledCourse[]> {
  const res = await fetch(`${getBaseUrl()}/enrollments/my-courses`, {
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) return [];

  const json = await res.json();
  // Handle both { data: [...] } and [...] shapes
  return Array.isArray(json) ? json : (json.data ?? []);
}
