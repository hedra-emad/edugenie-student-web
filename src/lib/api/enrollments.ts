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

export interface CoursePricing {
  courseId: string;
  fullPrice: number;
  ownedSectionValue: number;
  remainingPrice: number;
  owned: "none" | "section" | "full";
  ownedSectionCount: number;
  totalSections: number;
}

/**
 * What the signed-in student would pay to buy the full course now — full price
 * minus the value of sections they already own. Returns null for guests / on
 * error so the caller falls back to the catalog price.
 */
export async function fetchCoursePricing(
  courseId: string,
): Promise<CoursePricing | null> {
  const res = await fetch(`${getBaseUrl()}/enrollments/pricing/${courseId}`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = await res.json();
  return (json?.data ?? json) as CoursePricing;
}
