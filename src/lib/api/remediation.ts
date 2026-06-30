// Quiz-recovery (remediation) client. When a student fails a section quiz the
// final time, the coach builds a plan of the exact lessons to rewatch. Calls go
// through the same-origin proxy (JWT cookie).

const PROXY = process.env.NEXT_PUBLIC_API_BASE || "/api/proxy";

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
  createdAt?: string | null;
}

export async function getActiveRemediation(): Promise<RemediationPlan[]> {
  try {
    const res = await fetch(`${PROXY}/ai/remediation`, {
      credentials: "include",
    });
    if (!res.ok) return [];
    return (await res.json()) as RemediationPlan[];
  } catch {
    return [];
  }
}
