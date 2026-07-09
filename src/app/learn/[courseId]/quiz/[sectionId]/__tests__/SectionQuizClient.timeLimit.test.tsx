// @vitest-environment jsdom
// Regression guard for the quiz time-limit unit bug.
//
// `timeLimit` is SECONDS (the backend expires an attempt at
// `elapsedSeconds > attempt.timeLimit`). The client used to treat it as
// minutes: it rendered "600 minutes" and started a 36000-second countdown,
// while the server killed the attempt at 600 seconds and scored it 0 — burning
// one of the student's 3 attempts with hours still showing on the clock.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import SectionQuizClient from "../SectionQuizClient";

const TIME_LIMIT_SECONDS = 600; // the schema default — a 10-minute quiz

vi.mock("@/lib/api/sectionQuiz", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/sectionQuiz")>();
  return {
    ...actual,
    getSectionQuiz: vi.fn(),
    startSectionQuiz: vi.fn(),
    submitSectionQuiz: vi.fn(),
  };
});

import {
  getSectionQuiz,
  startSectionQuiz,
  submitSectionQuiz,
} from "@/lib/api/sectionQuiz";

const quiz = {
  quizId: "q1",
  timeLimit: TIME_LIMIT_SECONDS,
  passingScore: 80,
  attemptNumber: 1,
  maxAttempts: 3,
  attemptsRemaining: 3,
  questionType: "SINGLE_CHOICE",
  questions: [
    {
      questionId: "q-1",
      text: "2 + 2 ?",
      type: "SINGLE_CHOICE",
      options: [
        { optionId: "a", text: "3" },
        { optionId: "b", text: "4" },
      ],
    },
  ],
};

/** Flush pending promise callbacks without letting the fake clock move. */
async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

/** Render and settle on the intro phase. */
async function renderIntro() {
  render(<SectionQuizClient courseId="c1" sectionId="s1" />);
  await flush();
}

/** Get to the "taking" phase with the countdown running. */
async function startQuiz() {
  await renderIntro();
  fireEvent.click(screen.getByRole("button", { name: "Start quiz" }));
  await flush();
}

/** Advance the countdown by whole seconds. */
async function tick(seconds: number) {
  await act(async () => {
    vi.advanceTimersByTime(seconds * 1000);
  });
}

describe("SectionQuizClient — timeLimit is seconds, not minutes", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(getSectionQuiz).mockResolvedValue(quiz);
    vi.mocked(startSectionQuiz).mockResolvedValue({
      attemptId: "a1",
      startedAt: new Date(0).toISOString(),
      timeLimit: TIME_LIMIT_SECONDS,
    });
    vi.mocked(submitSectionQuiz).mockResolvedValue({
      passed: false,
      score: 0,
      correctAnswers: 0,
      totalQuestions: 1,
      attemptNumber: 1,
      remainingAttempts: 2,
      progressReset: false,
    } as Awaited<ReturnType<typeof submitSectionQuiz>>);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("shows the intro time limit as 10 minutes, not 600 minutes", async () => {
    await renderIntro();

    expect(screen.getByText("10 minutes")).toBeTruthy();
    expect(screen.queryByText("600 minutes")).toBeNull();
  });

  it("starts the countdown at 10:00, not 600:00", async () => {
    await startQuiz();

    expect(screen.getByText("10:00")).toBeTruthy();
    expect(screen.queryByText("600:00")).toBeNull();
  });

  it("counts down in real seconds", async () => {
    await startQuiz();
    await tick(5);

    expect(screen.getByText("9:55")).toBeTruthy();
  });

  it("auto-submits exactly when the server would expire the attempt", async () => {
    await startQuiz();

    // One tick short of the limit — the server would still accept this attempt.
    await tick(TIME_LIMIT_SECONDS - 1);
    expect(submitSectionQuiz).not.toHaveBeenCalled();

    await tick(1);
    await flush();
    expect(submitSectionQuiz).toHaveBeenCalledTimes(1);
  });
});
