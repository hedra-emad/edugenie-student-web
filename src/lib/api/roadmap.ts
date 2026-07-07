// Structured roadmap client — build a buyable learning path, read quota, and
// list saved roadmaps. Calls go through the same-origin proxy (JWT cookie).

const PROXY = process.env.NEXT_PUBLIC_API_BASE || "/api/proxy";

export interface RoadmapItem {
  type: "course" | "section";
  courseId: string;
  sectionId?: string;
  title: string;
  courseTitle: string;
  price: number;
  reason?: string;
}

export interface RoadmapMilestone {
  title: string;
  focus: string;
  items: RoadmapItem[];
}

export interface Roadmap {
  id: string;
  goal: string;
  level: string;
  summary: string;
  benefits?: string[];
  milestones: RoadmapMilestone[];
  items: RoadmapItem[];
  totalPrice: number;
  status: "active" | "saved" | "purchased";
  purchasedAt?: string | null;
  createdAt?: string | null;
  generationsRemaining?: number;
  // Per-roadmap AI budget (fixed 30-day window).
  aiRemaining?: number;
  aiAttemptsUsed?: number;
  aiMax?: number;
  aiResetsAt?: string | null;
}

export interface RoadmapQuota {
  remaining: number;
  resetsAt: string | null;
  max: number;
}

/** Item shape the edit endpoint accepts (ids + type only; server re-prices). */
export interface RoadmapItemEdit {
  type: "course" | "section";
  courseId: string;
  sectionId?: string;
  reason?: string;
}

export interface RoadmapMilestoneEdit {
  title: string;
  focus?: string;
  items: RoadmapItemEdit[];
}

export interface BuildRoadmapInput {
  goal: string;
  level?: string;
  time?: string;
  timeline?: string;
  focus?: string[];
  notes?: string;
}

async function readError(res: Response): Promise<string> {
  const body = (await res.json().catch(() => ({}))) as { message?: unknown };
  const m = body.message;
  if (Array.isArray(m)) return m.join(", ");
  if (typeof m === "string") return m;
  return "Something went wrong. Please try again.";
}

/** AI attempts left for the user's ACTIVE roadmap (+ reset date). */
export async function getRoadmapQuota(): Promise<RoadmapQuota> {
  try {
    const res = await fetch(`${PROXY}/ai/roadmap/quota`, {
      credentials: "include",
    });
    if (!res.ok) return { remaining: 0, resetsAt: null, max: 3 };
    const d = (await res.json()) as Partial<RoadmapQuota>;
    return {
      remaining: typeof d.remaining === "number" ? d.remaining : 0,
      resetsAt: d.resetsAt ?? null,
      max: typeof d.max === "number" ? d.max : 3,
    };
  } catch {
    return { remaining: 0, resetsAt: null, max: 3 };
  }
}

export async function buildRoadmap(
  input: BuildRoadmapInput,
): Promise<Roadmap> {
  const res = await fetch(`${PROXY}/ai/roadmap/build`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json() as Promise<Roadmap>;
}

export async function listRoadmaps(): Promise<Roadmap[]> {
  const res = await fetch(`${PROXY}/ai/roadmap`, { credentials: "include" });
  if (!res.ok) throw new Error(await readError(res));
  return res.json() as Promise<Roadmap[]>;
}

export async function getRoadmap(id: string): Promise<Roadmap> {
  const res = await fetch(`${PROXY}/ai/roadmap/${id}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json() as Promise<Roadmap>;
}

/** The user's single active roadmap, or null if none — for rehydrating the page. */
export async function getActiveRoadmap(): Promise<Roadmap | null> {
  try {
    const res = await fetch(`${PROXY}/ai/roadmap/active`, {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Roadmap | null;
    return data && data.id ? data : null;
  } catch {
    return null;
  }
}

/** Save edits (remove/reorder/add). Server re-validates + re-prices and returns
 * the canonical roadmap. */
export async function updateRoadmap(
  id: string,
  milestones: RoadmapMilestoneEdit[],
): Promise<Roadmap> {
  const res = await fetch(`${PROXY}/ai/roadmap/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ milestones }),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json() as Promise<Roadmap>;
}

/** "Save & buy later": park the active draft in the profile (frees the builder). */
export async function saveRoadmap(id: string): Promise<Roadmap> {
  const res = await fetch(`${PROXY}/ai/roadmap/${id}/save`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json() as Promise<Roadmap>;
}

export async function deleteRoadmap(id: string): Promise<void> {
  const res = await fetch(`${PROXY}/ai/roadmap/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(await readError(res));
}

/** Map a full Roadmap's milestones to the edit payload (ids + type only). */
export function toMilestoneEdits(
  milestones: RoadmapMilestone[],
): RoadmapMilestoneEdit[] {
  return milestones.map((m) => ({
    title: m.title,
    focus: m.focus,
    items: m.items.map((i) => ({
      type: i.type,
      courseId: i.courseId,
      sectionId: i.sectionId,
      reason: i.reason,
    })),
  }));
}
