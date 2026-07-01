"use client";
// SectionQuizClient.tsx
// Phases: loading → intro (no attempt spent) → taking (timer running) →
// submitting → result. Fetching the quiz doesn't consume an attempt; only
// "Start quiz" (startSectionQuiz) does.

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  getSectionQuiz,
  startSectionQuiz,
  submitSectionQuiz,
  isMultiSelect,
  type SectionQuiz,
  type QuizSubmitResult,
  type SubmitAnswer,
} from "@/lib/api/sectionQuiz";

type Phase =
  | "loading"
  | "intro"
  | "taking"
  | "submitting"
  | "result"
  | "error";

const BRAND = "#3B1892";

function formatMinutes(min: number): string {
  if (!min || min <= 0) return "No limit";
  return min === 1 ? "1 minute" : `${min} minutes`;
}

function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function typeLabel(type: string): string {
  switch (type) {
    case "MULTI_CHOICE":
      return "Select all that apply";
    case "TRUE_FALSE":
      return "True / False";
    case "SINGLE_CHOICE":
      return "Choose one";
    default:
      return "Choose the best answer";
  }
}

export default function SectionQuizClient({
  courseId,
  sectionId,
}: {
  courseId: string;
  sectionId: string;
}) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [quiz, setQuiz] = useState<SectionQuiz | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<QuizSubmitResult | null>(null);
  const [error, setError] = useState<string>("");
  const [remaining, setRemaining] = useState<number>(0); // seconds

  // ── Load quiz metadata (does not consume an attempt) ──────────────────────
  const loadInfo = useCallback(async () => {
    setPhase("loading");
    setError("");
    setResult(null);
    setAnswers({});
    setAttemptId(null);
    try {
      const q = await getSectionQuiz(sectionId);
      setQuiz(q);
      setPhase("intro");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load the quiz.");
      setPhase("error");
    }
  }, [sectionId]);

  useEffect(() => {
    void loadInfo();
  }, [loadInfo]);

  // ── Countdown while taking ────────────────────────────────────────────────
  const submitRef = useRef<() => void>(() => {});
  useEffect(() => {
    if (phase !== "taking" || !quiz || quiz.timeLimit <= 0) return;
    const iv = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(iv);
          submitRef.current();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [phase, quiz]);

  const begin = async () => {
    if (!quiz) return;
    try {
      const started = await startSectionQuiz(sectionId);
      setAttemptId(started.attemptId);
      setRemaining((started.timeLimit || quiz.timeLimit) * 60);
      setPhase("taking");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't start the quiz.");
      setPhase("error");
    }
  };

  const toggle = (questionId: string, optionId: string, multi: boolean) => {
    setAnswers((prev) => {
      const current = prev[questionId] ?? [];
      if (multi) {
        const next = current.includes(optionId)
          ? current.filter((o) => o !== optionId)
          : [...current, optionId];
        return { ...prev, [questionId]: next };
      }
      return { ...prev, [questionId]: [optionId] };
    });
  };

  const doSubmit = useCallback(async () => {
    if (!quiz || !attemptId) return;
    setPhase("submitting");
    const payload: SubmitAnswer[] = quiz.questions.map((q) => ({
      questionId: q.questionId,
      selectedOptionIds: answers[q.questionId] ?? [],
    }));
    try {
      const res = await submitSectionQuiz(sectionId, attemptId, payload);
      setResult(res);
      setPhase("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't submit the quiz.");
      setPhase("error");
    }
  }, [quiz, attemptId, answers, sectionId]);
  useEffect(() => {
    submitRef.current = doSubmit;
  }, [doSubmit]);

  const answeredCount = quiz
    ? quiz.questions.filter((q) => (answers[q.questionId] ?? []).length > 0)
        .length
    : 0;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-2xl px-4 py-8">
        <Link
          href={`/learn/${courseId}`}
          className="mb-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 transition-colors hover:text-slate-700"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back to course
        </Link>

        {phase === "loading" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8">
            <div className="h-5 w-1/2 animate-pulse rounded bg-slate-100" />
            <div className="mt-4 h-24 animate-pulse rounded bg-slate-100" />
          </div>
        )}

        {phase === "error" && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
            <p className="text-[15px] font-semibold text-rose-800">
              Something went wrong
            </p>
            <p className="mt-1 text-[13.5px] text-rose-600">{error}</p>
            <button
              type="button"
              onClick={loadInfo}
              className="mt-4 rounded-xl bg-white px-4 py-2 text-[13px] font-semibold text-rose-700 ring-1 ring-rose-200 transition-colors hover:bg-rose-100"
            >
              Try again
            </button>
          </div>
        )}

        {phase === "intro" && quiz && (
          <QuizIntro quiz={quiz} onBegin={begin} />
        )}

        {(phase === "taking" || phase === "submitting") && quiz && (
          <div>
            {/* Sticky header — progress + timer */}
            <div className="sticky top-0 z-10 -mx-4 mb-5 flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-4 py-3 backdrop-blur">
              <p className="text-[13px] font-semibold text-slate-600">
                {answeredCount}/{quiz.questions.length} answered
              </p>
              {quiz.timeLimit > 0 && (
                <p
                  className={`rounded-lg px-3 py-1.5 text-[13px] font-bold tabular-nums ${
                    remaining <= 30
                      ? "bg-rose-100 text-rose-700"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {formatClock(remaining)}
                </p>
              )}
            </div>

            <div className="space-y-4">
              {quiz.questions.map((q, i) => {
                const multi = isMultiSelect(q.type);
                const selected = answers[q.questionId] ?? [];
                return (
                  <div
                    key={q.questionId}
                    className="rounded-2xl border border-slate-200 bg-white p-5"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <p className="text-[15px] font-semibold leading-snug text-slate-900">
                        <span className="mr-1.5 text-slate-400">{i + 1}.</span>
                        {q.text}
                      </p>
                      <span className="mt-0.5 shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wide text-slate-500">
                        {typeLabel(q.type)}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {q.options.map((opt) => {
                        const checked = selected.includes(opt.optionId);
                        return (
                          <button
                            key={opt.optionId}
                            type="button"
                            onClick={() =>
                              toggle(q.questionId, opt.optionId, multi)
                            }
                            className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-[14px] transition-colors ${
                              checked
                                ? "border-[#3B1892] bg-violet-50 text-slate-900"
                                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            <span
                              className={`flex h-5 w-5 shrink-0 items-center justify-center border ${
                                multi ? "rounded-md" : "rounded-full"
                              } ${
                                checked
                                  ? "border-[#3B1892] bg-[#3B1892] text-white"
                                  : "border-slate-300"
                              }`}
                            >
                              {checked && (
                                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                                  <path d="M20 6L9 17l-5-5" />
                                </svg>
                              )}
                            </span>
                            {opt.text}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={doSubmit}
              disabled={phase === "submitting"}
              className="mt-6 w-full rounded-xl px-4 py-3.5 text-[15px] font-bold text-white transition-opacity disabled:opacity-60"
              style={{ backgroundColor: BRAND }}
            >
              {phase === "submitting" ? "Submitting…" : "Submit quiz"}
            </button>
            {answeredCount < quiz.questions.length && phase === "taking" && (
              <p className="mt-2 text-center text-[12.5px] text-slate-400">
                {quiz.questions.length - answeredCount} question
                {quiz.questions.length - answeredCount === 1 ? "" : "s"} still
                unanswered
              </p>
            )}
          </div>
        )}

        {phase === "result" && result && quiz && (
          <QuizResultCard
            result={result}
            passingScore={quiz.passingScore}
            courseId={courseId}
            onRetry={loadInfo}
          />
        )}
      </div>
    </div>
  );
}

// ── Intro screen ────────────────────────────────────────────────────────────
function QuizIntro({
  quiz,
  onBegin,
}: {
  quiz: SectionQuiz;
  onBegin: () => void;
}) {
  const noAttempts = quiz.attemptsRemaining <= 0;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
      <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-[11.5px] font-semibold text-[#3B1892]">
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
        </svg>
        Section quiz
      </div>
      <h1 className="text-[22px] font-bold tracking-tight text-slate-900">
        Ready to unlock the next section?
      </h1>
      <p className="mt-1.5 text-[14px] leading-relaxed text-slate-500">
        Pass this quiz with{" "}
        <span className="font-semibold text-slate-700">
          {quiz.passingScore}%
        </span>{" "}
        or higher to unlock the next section you own. Take your time — read each
        question carefully.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Questions" value={String(quiz.questions.length)} />
        <StatTile label="Time limit" value={formatMinutes(quiz.timeLimit)} />
        <StatTile label="Pass mark" value={`${quiz.passingScore}%`} />
        <StatTile
          label="Attempt"
          value={`${quiz.attemptNumber}/${quiz.maxAttempts}`}
        />
      </div>

      <div className="mt-5 space-y-2 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
        <Warn>Once you start, the timer runs and can’t be paused.</Warn>
        <Warn>
          You have{" "}
          <span className="font-semibold">{quiz.attemptsRemaining}</span> attempt
          {quiz.attemptsRemaining === 1 ? "" : "s"} left. Fail all attempts and
          your section progress resets — your coach will build a recovery plan.
        </Warn>
      </div>

      <button
        type="button"
        onClick={onBegin}
        disabled={noAttempts}
        className="mt-6 w-full rounded-xl px-4 py-3.5 text-[15px] font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
        style={{ backgroundColor: BRAND }}
      >
        {noAttempts ? "No attempts remaining" : "Start quiz"}
      </button>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-center">
      <p className="text-[15px] font-bold leading-tight text-slate-900">
        {value}
      </p>
      <p className="mt-1 text-[11px] font-medium text-slate-400">{label}</p>
    </div>
  );
}

function Warn({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 text-[12.5px] leading-relaxed text-amber-800">
      <svg className="mt-0.5 h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <path d="M12 9v4M12 17h.01" />
      </svg>
      <span>{children}</span>
    </p>
  );
}

// ── Result card ─────────────────────────────────────────────────────────────
function QuizResultCard({
  result,
  passingScore,
  courseId,
  onRetry,
}: {
  result: QuizSubmitResult;
  passingScore: number;
  courseId: string;
  onRetry: () => void;
}) {
  const { passed, score, correctAnswers, totalQuestions, remainingAttempts, progressReset } =
    result;

  if (passed) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center sm:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white">
          <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h1 className="mt-4 text-[22px] font-bold text-emerald-900">
          Passed — {score}%
        </h1>
        <p className="mt-1 text-[14px] text-emerald-700">
          {correctAnswers}/{totalQuestions} correct.
          {result.nextSectionUnlocked
            ? " The next section is now unlocked."
            : " Section complete."}
        </p>
        <Link
          href={`/learn/${courseId}`}
          className="mt-6 inline-block rounded-xl bg-emerald-600 px-5 py-3 text-[14px] font-bold text-white transition-colors hover:bg-emerald-700"
        >
          Continue learning
        </Link>
      </div>
    );
  }

  // Failed — differentiate retriable vs. progress reset (all attempts gone).
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center sm:p-8">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-500 text-white">
        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </div>
      <h1 className="mt-4 text-[22px] font-bold text-rose-900">
        Not quite — {score}%
      </h1>
      <p className="mt-1 text-[14px] text-rose-700">
        {correctAnswers}/{totalQuestions} correct. You need {passingScore}% to
        pass.
      </p>

      {progressReset ? (
        <div className="mt-5">
          <p className="text-[13.5px] leading-relaxed text-rose-700">
            You’ve used all your attempts, so this section’s progress has reset.
            Your AI coach has built a focused recovery plan on the concepts you
            missed.
          </p>
          <Link
            href="/coach"
            className="mt-4 inline-block rounded-xl bg-[#3B1892] px-5 py-3 text-[14px] font-bold text-white transition-colors hover:bg-[#2A1069]"
          >
            View my recovery plan
          </Link>
        </div>
      ) : (
        <div className="mt-5">
          <p className="text-[13.5px] text-rose-700">
            You have{" "}
            <span className="font-semibold">{remainingAttempts}</span> attempt
            {remainingAttempts === 1 ? "" : "s"} left. Review the lessons and try
            again.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={onRetry}
              className="rounded-xl bg-rose-600 px-5 py-3 text-[14px] font-bold text-white transition-colors hover:bg-rose-700"
            >
              Try again
            </button>
            <Link
              href={`/learn/${courseId}`}
              className="rounded-xl bg-white px-5 py-3 text-[14px] font-bold text-rose-700 ring-1 ring-rose-200 transition-colors hover:bg-rose-100"
            >
              Review lessons
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
