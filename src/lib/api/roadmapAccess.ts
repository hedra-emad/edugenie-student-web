// Live per-course ownership for roadmap items — derived from the backend's
// `enrollments/my-access/:courseId`. Shared by the roadmap advisor page and the
// profile "My Roadmaps" tab so both mark owned items + price only the remainder.

import type { RoadmapItem } from "@/lib/api/roadmap";

const PROXY = process.env.NEXT_PUBLIC_API_BASE || "/api/proxy";

export interface Access {
  accessType: string;
  sections: Set<string>;
}

export async function fetchAccess(courseId: string): Promise<Access> {
  try {
    const r = await fetch(`${PROXY}/enrollments/my-access/${courseId}`, {
      credentials: "include",
    });
    if (!r.ok) return { accessType: "none", sections: new Set() };
    const d = (await r.json()) as {
      accessType?: string;
      accessibleSections?: string[];
    };
    return {
      accessType: d.accessType ?? "none",
      sections: new Set(
        Array.isArray(d.accessibleSections) ? d.accessibleSections : [],
      ),
    };
  } catch {
    return { accessType: "none", sections: new Set() };
  }
}

/** Fetch access for a set of courses (deduped) as a courseId → Access map. */
export async function fetchAccessMap(
  courseIds: string[],
): Promise<Map<string, Access>> {
  const ids = [...new Set(courseIds.filter(Boolean))];
  const entries = await Promise.all(
    ids.map(async (id) => [id, await fetchAccess(id)] as const),
  );
  return new Map(entries);
}

/** True when the student already owns this roadmap item. */
export function isOwned(
  item: RoadmapItem,
  access: Map<string, Access>,
): boolean {
  const a = access.get(item.courseId);
  if (!a) return false;
  if (a.accessType === "full_course") return true;
  if (item.type === "section" && item.sectionId) {
    return a.sections.has(item.sectionId);
  }
  return false;
}
