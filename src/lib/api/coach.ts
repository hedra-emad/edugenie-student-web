// Coach snapshot + weekly-goal client. Goes through the same-origin BFF proxy
// (JWT cookie attached server-side), mirroring lib/api/roadmap.ts.

const PROXY = process.env.NEXT_PUBLIC_API_BASE || "/api/proxy";

export interface CoachStreak {
  current: number;
  longest: number;
  activeToday: boolean;
}

export interface CoachGoal {
  target: number;
  completedThisWeek: number;
  remaining: number;
  pct: number;
}

export interface CoachInProgress {
  courseId: string;
  title: string;
  progressPercent: number;
  stalled: boolean;
}

export interface CoachWeakSpot {
  courseId: string;
  sectionId: string;
  courseTitle: string;
  sectionTitle: string;
  score: number;
  passed: boolean;
}

export interface CoachSnapshot {
  totalCourses: number;
  completedCount: number;
  inProgressCount: number;
  stalledCount: number;
  notStartedCount: number;
  weakSpotCount: number;
  recentAvgScore: number | null;
  inProgress: CoachInProgress[];
  weakSpots: CoachWeakSpot[];
  streak: CoachStreak;
  goal: CoachGoal | null;
}

export async function getCoachSnapshot(): Promise<CoachSnapshot | null> {
  try {
    const res = await fetch(`${PROXY}/ai/coach/snapshot`, {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as CoachSnapshot;
  } catch {
    return null;
  }
}

export interface CoachMission {
  key: string;
  type: 'streak' | 'weak_spot' | 'resume_course' | 'any_lesson' | 'any_quiz';
  label: string;
  xp: number;
  courseId?: string;
  sectionId?: string;
  done: boolean;
}

export interface CoachMissions {
  day: string;
  missions: CoachMission[];
  doneCount: number;
  total: number;
  allDone: boolean;
  xpTotal: number;
  level: number;
  note: string;
}

/** Today's assigned missions (auto-verified from real activity) + XP. */
export async function getCoachMissions(): Promise<CoachMissions | null> {
  try {
    const res = await fetch(`${PROXY}/ai/coach/missions`, {
      credentials: 'include',
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return (await res.json()) as CoachMissions;
  } catch {
    return null;
  }
}

/** Set the weekly lessons goal (1–20). Returns the refreshed snapshot. */
export async function setCoachGoal(
  weeklyGoalLessons: number,
): Promise<CoachSnapshot> {
  const res = await fetch(`${PROXY}/ai/coach/goal`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ weeklyGoalLessons }),
  });
  if (!res.ok) throw new Error("Could not update your goal. Please try again.");
  return (await res.json()) as CoachSnapshot;
}
