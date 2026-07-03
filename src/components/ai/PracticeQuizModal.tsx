"use client";
// Reusable "Quiz Me" modal: generates a short, AI-written practice quiz for one
// section, lets the student answer, then grades instantly and reveals the
// correct answers. Drop it anywhere with a sectionId (Coach weak spots, the
// course player, the course detail page, etc.).

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import {
  generatePracticeQuiz,
  submitPracticeQuiz,
  type PracticeQuiz,
  type PracticeResult,
} from "@/lib/api/practice";

type Phase = "loading" | "answering" | "grading" | "result" | "error";
type Difficulty = "EASY" | "MEDIUM" | "HARD";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export default function PracticeQuizModal({
  sectionId,
  label,
  onClose,
}: {
  sectionId: string;
  label?: string;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [quiz, setQuiz] = useState<PracticeQuiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<PracticeResult | null>(null);
  const [error, setError] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM");

  const load = useCallback(
    async (level: Difficulty) => {
      setPhase("loading");
      setError("");
      setResult(null);
      setAnswers({});
      try {
        const q = await generatePracticeQuiz({
          sectionId,
          difficulty: level,
          numberOfQuestions: 5,
        });
        setQuiz(q);
        setPhase("answering");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not start the quiz.");
        setPhase("error");
      }
    },
    [sectionId],
  );

  useEffect(() => {
    void load(difficulty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const answeredCount = quiz
    ? quiz.questions.filter((q) => answers[q.id] !== undefined).length
    : 0;
  const allAnswered = !!quiz && answeredCount === quiz.questions.length;

  const submit = async () => {
    if (!quiz || !allAnswered) return;
    setPhase("grading");
    try {
      const res = await submitPracticeQuiz(
        quiz.practiceId,
        quiz.questions.map((q) => ({
          questionId: q.id,
          selected: [answers[q.id]],
        })),
      );
      setResult(res);
      setPhase("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not grade the quiz.");
      setPhase("error");
    }
  };

  const retake = (level: Difficulty) => {
    setDifficulty(level);
    void load(level);
  };

  const answering = phase === "answering" || phase === "grading";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative flex flex-shrink-0 items-start justify-between gap-3 bg-gradient-to-br from-[#3B1892] to-[#6D4AD6] px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
              <SparkleSvg />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[15px] font-bold leading-tight">Quiz Me</p>
                <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/90">
                  {(quiz?.difficulty ?? difficulty).toLowerCase()}
                </span>
              </div>
              {label && (
                <p className="mt-0.5 line-clamp-1 text-[12px] text-white/75">
                  {label}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghostOnColor"
            size="icon"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </Button>
        </div>

        {/* Progress bar (while answering) */}
        {answering && quiz && (
          <div className="h-1 w-full flex-shrink-0 bg-slate-100">
            <div
              className="h-full rounded-r-full bg-gradient-to-r from-[#3B1892] to-[#6D4AD6] transition-all duration-300"
              style={{
                width: `${(answeredCount / quiz.questions.length) * 100}%`,
              }}
            />
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {phase === "loading" && (
            <Centered>
              <Spinner />
              <p className="mt-3 text-[13px] font-medium text-slate-500">
                Writing your quiz…
              </p>
            </Centered>
          )}

          {phase === "error" && (
            <Centered>
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <path d="M12 9v4M12 17h.01" />
                </svg>
              </div>
              <p className="text-[13.5px] font-medium text-slate-600">{error}</p>
              <Button size="sm" onClick={() => load(difficulty)} className="mt-4">
                Try again
              </Button>
            </Centered>
          )}

          {answering && quiz && (
            <div className="space-y-6">
              {quiz.questions.map((q, qi) => (
                <div key={q.id}>
                  <p className="mb-2.5 text-[13.5px] font-semibold leading-snug text-slate-800">
                    <span className="text-slate-400">{qi + 1}.</span>{" "}
                    {q.questionText}
                  </p>
                  <div className="space-y-2">
                    {q.options.map((opt, oi) => {
                      const selected = answers[q.id] === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          disabled={phase === "grading"}
                          onClick={() =>
                            setAnswers((p) => ({ ...p, [q.id]: opt }))
                          }
                          className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-[13px] transition-all disabled:opacity-60 ${
                            selected
                              ? "border-[#3B1892] bg-violet-50 font-medium text-[#3B1892] shadow-sm"
                              : "border-slate-200 bg-white text-slate-600 hover:border-[#3B1892]/40 hover:bg-slate-50"
                          }`}
                        >
                          <span
                            className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg text-[11px] font-bold ${
                              selected
                                ? "bg-[#3B1892] text-white"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {LETTERS[oi] ?? "•"}
                          </span>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {phase === "result" && result && (
            <div className="space-y-6">
              <div className="flex flex-col items-center rounded-2xl bg-gradient-to-b from-slate-50 to-white py-5">
                <ScoreRing score={result.score} passed={result.passed} />
                <p className="mt-2 text-[13px] font-medium text-slate-500">
                  {result.correct} / {result.total} correct ·{" "}
                  <span
                    className={
                      result.passed ? "text-green-600" : "text-amber-600"
                    }
                  >
                    {result.passed ? "Nice work! 🎉" : "Keep practicing"}
                  </span>
                </p>
              </div>

              {result.results.map((r, ri) => (
                <div key={r.id}>
                  <p className="mb-2 flex items-start gap-2 text-[13.5px] font-semibold leading-snug text-slate-800">
                    <span
                      className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[11px] text-white ${
                        r.isCorrect ? "bg-green-500" : "bg-red-500"
                      }`}
                    >
                      {r.isCorrect ? "✓" : "✗"}
                    </span>
                    <span>
                      <span className="text-slate-400">{ri + 1}.</span>{" "}
                      {r.questionText}
                    </span>
                  </p>
                  <div className="space-y-1.5 pl-7">
                    {r.options.map((opt) => {
                      const isCorrect = r.correctAnswer.includes(opt);
                      const isYours = r.yourAnswer.includes(opt);
                      return (
                        <div
                          key={opt}
                          className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-[12.5px] ${
                            isCorrect
                              ? "border-green-200 bg-green-50 font-medium text-green-700"
                              : isYours
                                ? "border-red-200 bg-red-50 text-red-600"
                                : "border-slate-200 bg-white text-slate-500"
                          }`}
                        >
                          <span className={isYours && !isCorrect ? "line-through" : ""}>
                            {opt}
                          </span>
                          {isCorrect && (
                            <span className="text-[11px] font-semibold">
                              Correct ✓
                            </span>
                          )}
                          {isYours && !isCorrect && (
                            <span className="text-[11px] font-semibold">
                              Your answer
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-shrink-0 items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3.5">
          {answering ? (
            <>
              <span className="text-[11.5px] font-medium text-slate-400">
                {quiz
                  ? `${answeredCount}/${quiz.questions.length} answered`
                  : ""}
              </span>
              <Button
                onClick={submit}
                disabled={!allAnswered || phase === "grading"}
              >
                {phase === "grading" ? "Grading…" : "Submit answers"}
              </Button>
            </>
          ) : phase === "result" ? (
            <>
              <Button variant="outline" onClick={() => retake(difficulty)}>
                Retake
              </Button>
              <Button onClick={() => retake("HARD")}>Harder quiz →</Button>
            </>
          ) : (
            <span className="text-[11.5px] text-slate-400">
              AI-generated · doesn&apos;t affect your course grade
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function ScoreRing({ score, passed }: { score: number; passed: boolean }) {
  const r = 34;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(100, Math.max(0, score)) / 100);
  const color = passed ? "#16a34a" : "#d97706";
  return (
    <svg width="92" height="92" viewBox="0 0 92 92">
      <circle cx="46" cy="46" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
      <circle
        cx="46"
        cy="46"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform="rotate(-90 46 46)"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
      <text
        x="46"
        y="46"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#0f172a"
        fontSize="20"
        fontWeight="800"
      >
        {score}%
      </text>
    </svg>
  );
}

function SparkleSvg() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
      <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" />
    </svg>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
      {children}
    </div>
  );
}

function Spinner() {
  return (
    <span className="inline-block h-8 w-8 animate-spin rounded-full border-[3px] border-slate-200 border-t-[#3B1892]" />
  );
}
