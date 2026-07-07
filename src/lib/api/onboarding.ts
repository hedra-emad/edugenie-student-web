// One-time onboarding client — status, submit (stores answers + builds the
// first free roadmap), and retry. All calls go through the same-origin proxy
// so the JWT cookie rides along.

import type { Roadmap } from "./roadmap";

const PROXY = process.env.NEXT_PUBLIC_API_BASE || "/api/proxy";

export interface OnboardingAnswers {
  specialization: string;
  currentLevel: string;
  hoursPerWeek: string;
  pace: string;
  priorExperience: string;
  endGoal: string;
  learningStyle?: string;
  knownTopics: string[];
  focusTopics: string[];
  extraNotes?: string;
  profileSummary?: string;
  completedAt?: string;
}

export interface OnboardingStatus {
  isVerified: boolean;
  hasOnboarded: boolean;
  onboarding: OnboardingAnswers | null;
}

export interface SubmitOnboardingInput {
  specialization: string;
  currentLevel: string;
  hoursPerWeek: string;
  pace: string;
  priorExperience: string;
  endGoal: string;
  learningStyle?: string;
  knownTopics?: string[];
  focusTopics?: string[];
  extraNotes?: string;
}

export interface SubmitOnboardingResult {
  hasOnboarded: boolean;
  roadmap: Roadmap | null;
  roadmapError?: string;
}

async function readError(res: Response): Promise<string> {
  const body = (await res.json().catch(() => ({}))) as { message?: unknown };
  const m = body.message;
  if (Array.isArray(m)) return m.join(", ");
  if (typeof m === "string") return m;
  return "Something went wrong. Please try again.";
}

export async function getOnboardingStatus(): Promise<OnboardingStatus | null> {
  try {
    const res = await fetch(`${PROXY}/onboarding`, { credentials: "include" });
    if (!res.ok) return null;
    return (await res.json()) as OnboardingStatus;
  } catch {
    return null;
  }
}

export async function submitOnboarding(
  input: SubmitOnboardingInput,
): Promise<SubmitOnboardingResult> {
  const res = await fetch(`${PROXY}/onboarding`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as SubmitOnboardingResult;
}

/** Retry the first roadmap from already-saved answers (stays free). */
export async function retryOnboardingRoadmap(): Promise<Roadmap> {
  const res = await fetch(`${PROXY}/onboarding/generate-roadmap`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as Roadmap;
}
