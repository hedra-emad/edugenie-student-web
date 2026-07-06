import { describe, it, expect } from "vitest";
import { coachHeadline } from "@/components/coach/CoachWidget";
import type { CoachMissions, CoachSnapshot } from "@/lib/api/coach";

const snap = (current: number, activeToday: boolean): CoachSnapshot =>
  ({ streak: { current, longest: current, activeToday } }) as CoachSnapshot;

const miss = (over: Partial<CoachMissions>): CoachMissions =>
  ({
    day: "2026-07-06",
    missions: [],
    doneCount: 0,
    total: 3,
    allDone: false,
    xpTotal: 0,
    level: 1,
    note: "",
    ...over,
  }) as CoachMissions;

describe("coachHeadline", () => {
  it("celebrates when all missions are done", () => {
    expect(
      coachHeadline({ missions: miss({ allDone: true, doneCount: 3 }), snapshot: snap(4, true) }),
    ).toMatch(/cleared/i);
  });

  it("shows streak + remaining when active today", () => {
    expect(
      coachHeadline({ missions: miss({ doneCount: 1 }), snapshot: snap(4, true) }),
    ).toBe("🔥 4-day streak — 2 to go today");
  });

  it("nudges to keep a broken (not-today) streak alive", () => {
    expect(
      coachHeadline({ missions: miss({ doneCount: 0 }), snapshot: snap(4, false) }),
    ).toMatch(/keep your 4-day streak/i);
  });

  it("falls back to a generic line without data", () => {
    expect(coachHeadline({ missions: null, snapshot: null })).toBe(
      "Your coach has today's plan ready",
    );
  });
});
