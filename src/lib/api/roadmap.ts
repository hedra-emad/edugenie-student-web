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
  milestones: RoadmapMilestone[];
  items: RoadmapItem[];
  totalPrice: number;
  status: "active" | "purchased";
  purchasedAt?: string | null;
  createdAt?: string | null;
  generationsRemaining?: number;
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

export async function getRoadmapQuota(): Promise<number> {
  try {
    const res = await fetch(`${PROXY}/ai/roadmap/quota`, {
      credentials: "include",
    });
    if (!res.ok) return 0;
    const d = (await res.json()) as { remaining?: number };
    return typeof d.remaining === "number" ? d.remaining : 0;
  } catch {
    return 0;
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
