// src/lib/api/remediation.ts
// Client for the AI "recovery plan" — generated when a student fails a section
// quiz on all attempts. Read-only from the student side.

const PROXY = "/api/proxy";

export interface RemediationItem {
  lessonId: string;
  lessonTitle: string;
  sectionId: string;
  sectionTitle: string;
  concept: string;
  reason: string;
}

export interface RemediationPlan {
  id: string;
  courseId: string;
  courseTitle: string;
  sectionId: string;
  sectionTitle: string;
  missedConcepts: string[];
  items: RemediationItem[];
  status: "active" | "resolved";
  createdAt: string;
}

/** Active recovery plans for the current student (empty on any error). */
export async function getActiveRemediation(): Promise<RemediationPlan[]> {
  try {
    const res = await fetch(`${PROXY}/ai/remediation`, {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = await res.json();
    const list = Array.isArray(json)
      ? json
      : Array.isArray(json.data)
        ? json.data
        : [];
    return list as RemediationPlan[];
  } catch {
    return [];
  }
}
