// @vitest-environment jsdom
// Regression guard: the Certificates stat once defaulted to 0 because
// ProfileClient never passed `certCount`, so the strip showed "0 Certificates"
// beside a Certificates tab listing a real certificate. The count must always
// equal the length of the certificate list it sits next to.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import ProfileStatsStrip from "../ProfileStatsStrip";
import type { UserProfile } from "@/types/profile.types";
import type { Certificate } from "@/lib/api/certificates";

const profile = {
  id: "u1",
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  role: "student",
  level: "beginner",
  skills: [],
  interests: [],
  profileViews: 0,
  isVerified: true,
  createdAt: "2024-03-15T00:00:00.000Z",
  updatedAt: "2024-03-15T00:00:00.000Z",
  status: "active",
  lastLoginAt: "2024-03-15T00:00:00.000Z",
  lastLoginDevice: "chrome",
  lastLoginLocation: "Cairo",
} as UserProfile;

function certificates(n: number): Certificate[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `c${i}`,
    certificateNumber: `EG-${i}`,
    verificationCode: `code-${i}`,
    studentName: "Ada Lovelace",
    courseTitle: "Introduction to Python Programming",
    instructorName: "Guido",
    issuedAt: "2024-06-01T00:00:00.000Z",
    courseId: `course-${i}`,
  }));
}

/** The count-up animation drives the value over rAF frames — run it to completion. */
async function settleCountUp() {
  await act(async () => {
    for (let i = 0; i < 5; i++) {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
    }
  });
}

/** The rendered value of a stat cell, found via its label. */
function statValue(label: string): string {
  const labelEl = screen.getByText(label);
  const cell = labelEl.parentElement;
  if (!cell) throw new Error(`no cell for "${label}"`);
  return (cell.firstElementChild?.textContent ?? "").trim();
}

describe("ProfileStatsStrip — Certificates count", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // jsdom's rAF is timer-backed; keep it in step with the fake clock.
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) =>
      setTimeout(() => cb(performance.now()), 16) as unknown as number,
    );
    vi.stubGlobal("cancelAnimationFrame", (id: number) =>
      clearTimeout(id as unknown as NodeJS.Timeout),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    cleanup();
  });

  // The reported bug: one real certificate, count rendered 0.
  it("shows 1 when the student has exactly one certificate", async () => {
    const certs = certificates(1);
    render(
      <ProfileStatsStrip
        profile={profile}
        enrolledCount={3}
        certCount={certs.length}
      />,
    );
    await settleCountUp();

    expect(statValue("Certificates")).toBe("1");
  });

  it("shows 0 when the student has no certificates", async () => {
    render(
      <ProfileStatsStrip profile={profile} enrolledCount={3} certCount={0} />,
    );
    await settleCountUp();

    expect(statValue("Certificates")).toBe("0");
  });

  it("shows the full count for many certificates", async () => {
    const certs = certificates(7);
    render(
      <ProfileStatsStrip
        profile={profile}
        enrolledCount={3}
        certCount={certs.length}
      />,
    );
    await settleCountUp();

    expect(statValue("Certificates")).toBe("7");
  });

  it("never disagrees with the list it is derived from", async () => {
    for (const n of [0, 1, 2, 12]) {
      const certs = certificates(n);
      render(
        <ProfileStatsStrip
          profile={profile}
          enrolledCount={0}
          certCount={certs.length}
        />,
      );
      await settleCountUp();

      expect(statValue("Certificates")).toBe(String(certs.length));
      cleanup();
    }
  });

  it("leaves the other stats alone", async () => {
    render(
      <ProfileStatsStrip profile={profile} enrolledCount={3} certCount={1} />,
    );
    await settleCountUp();

    expect(statValue("Courses Enrolled")).toBe("3");
    expect(statValue("Member Since")).toBe("Mar 2024");
  });
});
