"use client";
// Graded section quiz. Flow: intro (quiz info, no attempt consumed) → take
// (timer starts on Start) → result. Passing at 80% unlocks the next section.

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  getSectionQuiz,
  startSectionQuiz,
  submitSectionQuiz,
  type SectionQuiz,
  type QuizQuestionForStudent,
  type QuizResult,
} from "@/lib/api/sectionQuiz";

type Phase = "loading" | "intro" | "taking" | "submitting" | "result" | "error";

function isMulti(type: string) {
  return type === "MULTI_CHOICE" || type === "MIXED";
}

function typeHint(type: string): string {
  if (type === "MULTI_CHOICE") return "Select all that apply";
  if (type === "TRUE_FALSE") return "True or False";
  return "Choose one";
}

function formatMinutes(seconds: number): string {
  const m = Math.round(seconds / 60);
  return m <= 1 ? "1 min" : `${m} min`;
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
  const [result, setResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState("");
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const loadedRef = useRef(false);

  // Load quiz INFO only (does not consume an attempt or start the timer).
  const loadInfo = useCallback(async () => {
    setPhase("loading");
    setError("");
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
    if (loadedRef.current) return;
    loadedRef.current = true;
    void loadInfo();
  }, [loadInfo]);

  // Begin the attempt — NOW the timer starts.
  const begin = useCallback(async () => {
    if (!quiz) return;
    try {
      const start = await startSectionQuiz(sectionId);
      setAttemptId(start.attemptId);
      setAnswers({});
      setResult(null);
      setSecondsLeft(start.timeLimit || quiz.timeLimit || null);
      setPhase("taking");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't start the quiz.");
      setPhase("error");
    }
  }, [quiz, sectionId]);

  const select = (q: QuizQuestionForStudent, optionId: string) => {
    setAnswers((prev) => {
      const cur = prev[q.questionId] ?? [];
      if (isMulti(q.type)) {
        return {
          ...prev,
          [q.questionId]: cur.includes(optionId)
            ? cur.filter((o) => o !== optionId)
            : [...cur, optionId],
        };
      }
      return { ...prev, [q.questionId]: [optionId] };
    });
  };

  const submit = useCallback(async () => {
    if (!quiz || !attemptId) return;
    setPhase("submitting");
    try {
      const payload = quiz.questions.map((q) => ({
        questionId: q.questionId,
        selectedOptionIds: answers[q.questionId] ?? [],
      }));
      const res = await submitSectionQuiz(sectionId, attemptId, payload);
      setResult(res);
      setPhase("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't submit the quiz.");
      setPhase("error");
    }
  }, [quiz, attemptId, answers, sectionId]);

  // Countdown — auto-submit at zero.
  useEffect(() => {
    if (phase !== "taking" || secondsLeft === null) return;
    if (secondsLeft <= 0) {
      void submit();
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => (s ?? 1) - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, secondsLeft, submit]);

  const answeredCount = quiz
    ? quiz.questions.filter((q) => (answers[q.questionId] ?? []).length > 0)
        .length
    : 0;
  const allAnswered = quiz ? answeredCount === quiz.questions.length : false;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-10">
      <Link
        href={`/learn/${courseId}`}
        className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-700"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to course
      </Link>

      {phase === "loading" && (
        <p className="text-[14px] text-slate-500">Loading quiz…</p>
      )}

      {phase === "error" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-[15px] font-semibold text-slate-800">
            Can&apos;t start this quiz
          </p>
          <p className="mt-2 text-[13.5px] text-slate-500">{error}</p>
          <Link
            href={`/learn/${courseId}`}
            className="mt-5 inline-block rounded-xl bg-[#3B1892] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#2A1069]"
          >
            Back to course
          </Link>
        </div>
      )}

      {phase === "intro" && quiz && (
        <QuizIntro quiz={quiz} onStart={begin} />
      )}

      {(phase === "taking" || phase === "submitting") && quiz && (
        <>
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h1 className="text-[20px] font-bold tracking-tight text-slate-900">
                Section quiz
              </h1>
              <p className="mt-1 text-[13px] text-slate-500">
                Pass at <span className="font-semibold">{quiz.passingScore}%</span>{" "}
                to unlock the next section
              </p>
            </div>
            {secondsLeft !== null && (
              <span
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[13px] font-semibold tabular-nums ${
                  secondsLeft < 30
                    ? "bg-rose-50 text-rose-600"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
                {Math.floor(secondsLeft / 60)}:
                {String(secondsLeft % 60).padStart(2, "0")}
              </span>
            )}
          </div>

          <div className="space-y-4">
            {quiz.questions.map((q, qi) => (
              <QuestionCard
                key={q.questionId}
                question={q}
                index={qi}
                selected={answers[q.questionId] ?? []}
                onSelect={(optId) => select(q, optId)}
              />
            ))}
          </div>

          <div className="sticky bottom-0 mt-6 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur">
            <p className="pl-1 text-[12.5px] text-slate-500">
              {answeredCount}/{quiz.questions.length} answered
            </p>
            <button
              type="button"
              onClick={() => void submit()}
              disabled={phase === "submitting" || !allAnswered}
              className="rounded-xl bg-[#3B1892] px-5 py-2.5 text-[13.5px] font-semibold text-white transition-colors hover:bg-[#2A1069] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {phase === "submitting" ? "Submitting…" : "Submit quiz"}
            </button>
          </div>
        </>
      )}

      {phase === "result" && result && (
        <QuizResultCard
          result={result}
          courseId={courseId}
          onRetry={result.remainingAttempts > 0 ? loadInfo : undefined}
        />
      )}
    </div>
  );
}

// ── Intro / alert screen ─────────────────────────────────────────────────────

function QuizIntro({
  quiz,
  onStart,
}: {
  quiz: SectionQuiz;
  onStart: () => void;
}) {
  const [starting, setStarting] = useState(false);
  const noAttempts = quiz.attemptsRemaining <= 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="bg-gradient-to-br from-[#3B1892] to-[#5B3DB8] px-6 py-7 text-white">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
        </div>
        <h1 className="text-[20px] font-bold tracking-tight">
          Ready for the section quiz?
        </h1>
        <p className="mt-1 text-[13.5px] text-white/80">
          Score {quiz.passingScore}% or higher to unlock the next section.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
        <IntroStat label="Questions" value={String(quiz.questions.length)} />
        <IntroStat label="Time limit" value={formatMinutes(quiz.timeLimit)} />
        <IntroStat label="Pass mark" value={`${quiz.passingScore}%`} />
        <IntroStat
          label="Attempt"
          value={`${quiz.attemptNumber} / ${quiz.maxAttempts}`}
        />
      </div>

      <div className="space-y-2 border-t border-slate-100 px-5 py-4">
        {[
          `The ${formatMinutes(quiz.timeLimit)} timer starts as soon as you press Start.`,
          "You can't pause once you begin — finish in one sitting.",
          `You have ${quiz.attemptsRemaining} attempt${quiz.attemptsRemaining === 1 ? "" : "s"} left. Fail all of them and the section resets with a recovery plan.`,
        ].map((line) => (
          <p key={line} className="flex items-start gap-2 text-[12.5px] text-slate-500">
            <svg className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#3B1892]/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            {line}
          </p>
        ))}
      </div>

      <div className="border-t border-slate-100 p-4">
        <button
          type="button"
          disabled={starting || noAttempts}
          onClick={() => {
            setStarting(true);
            onStart();
          }}
          className="w-full rounded-xl bg-[#3B1892] px-5 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-[#2A1069] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {noAttempts
            ? "No attempts left"
            : starting
              ? "Starting…"
              : "Start quiz"}
        </button>
      </div>
    </div>
  );
}

function IntroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-center">
      <p className="text-[17px] font-bold leading-none text-slate-900">{value}</p>
      <p className="mt-1.5 text-[11px] font-medium text-slate-400">{label}</p>
    </div>
  );
}

// ── Question (type-aware) ────────────────────────────────────────────────────

function QuestionCard({
  question,
  index,
  selected,
  onSelect,
}: {
  question: QuizQuestionForStudent;
  index: number;
  selected: string[];
  onSelect: (optionId: string) => void;
}) {
  const multi = isMulti(question.type);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-1 flex items-center gap-2">
        <span className="rounded-md bg-violet-50 px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-[#3B1892]">
          {typeHint(question.type)}
        </span>
      </div>
      <p className="mb-3 text-[14.5px] font-semibold text-slate-800">
        {index + 1}. {question.text}
      </p>
      <div className="space-y-2">
        {question.options.map((opt) => {
          const checked = selected.includes(opt.optionId);
          return (
            <label
              key={opt.optionId}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 text-[13.5px] transition-colors ${
                checked
                  ? "border-[#3B1892] bg-[#3B1892]/[0.04] text-slate-800"
                  : "border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              <input
                type={multi ? "checkbox" : "radio"}
                name={question.questionId}
                checked={checked}
                onChange={() => onSelect(opt.optionId)}
                className="accent-[#3B1892]"
              />
              {opt.text}
            </label>
          );
        })}
      </div>
    </div>
  );
}

// ── Result ───────────────────────────────────────────────────────────────────

function QuizResultCard({
  result,
  courseId,
  onRetry,
}: {
  result: QuizResult;
  courseId: string;
  onRetry?: () => void;
}) {
  const passed = result.passed;
  return (
    <div
      className={`rounded-2xl border p-6 text-center shadow-sm ${
        passed
          ? "border-green-200 bg-green-50/50"
          : "border-amber-200 bg-amber-50/50"
      }`}
    >
      <div
        className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl text-white ${
          passed ? "bg-green-500" : "bg-amber-500"
        }`}
      >
        {passed ? "✓" : "!"}
      </div>
      <p className="text-[18px] font-bold text-slate-900">
        {passed ? "You passed!" : "Not quite yet"}
      </p>
      <p className="mt-1 text-[14px] text-slate-600">
        You scored <span className="font-semibold">{result.score}%</span> (
        {result.correctAnswers}/{result.totalQuestions} correct).
      </p>

      <p className="mt-3 text-[13.5px] text-slate-600">
        {passed
          ? "The next section is now unlocked. Keep going!"
          : result.progressReset
            ? "You've used all attempts for this section. Check your AI Coach for a recovery plan with the exact lessons to rewatch."
            : `You need 80% to unlock the next section. ${result.remainingAttempts} attempt(s) left.`}
      </p>

      <div className="mt-5 flex flex-wrap justify-center gap-2.5">
        <Link
          href={`/learn/${courseId}`}
          className="rounded-xl bg-[#3B1892] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#2A1069]"
        >
          Back to course
        </Link>
        {!passed && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-xl border border-[#3B1892] px-4 py-2.5 text-[13px] font-semibold text-[#3B1892] hover:bg-violet-50"
          >
            Try again
          </button>
        )}
        {!passed && result.progressReset && (
          <Link
            href="/coach"
            className="rounded-xl border border-rose-300 px-4 py-2.5 text-[13px] font-semibold text-rose-600 hover:bg-rose-50"
          >
            Open AI Coach
          </Link>
        )}
      </div>
    </div>
  );
}
