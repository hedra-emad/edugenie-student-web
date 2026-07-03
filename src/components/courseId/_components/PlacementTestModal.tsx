"use client";

// Pre-purchase AI placement test. The student answers a few AI-generated
// questions per section; we grade per section and recommend buying ONLY the
// sections they haven't mastered (≥80% = skip) — the "buy only what you need"
// experience. One click adds the recommendation to the cart.

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import {
  generatePlacement,
  submitPlacement,
  addRecommendedToCart,
  type PlacementTest,
  type PlacementRecommendation,
} from "@/lib/api/placement";

type Phase = "loading" | "quiz" | "grading" | "result" | "error";

interface Props {
  courseId: string;
  onClose: () => void;
}

export default function PlacementTestModal({ courseId, onClose }: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [test, setTest] = useState<PlacementTest | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<PlacementRecommendation | null>(null);
  const [error, setError] = useState<string>("");
  const [adding, setAdding] = useState(false);
  const startedRef = useRef(false);

  // Generate once on open.
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    generatePlacement(courseId)
      .then((t) => {
        setTest(t);
        setPhase("quiz");
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Could not start the test.");
        setPhase("error");
      });
  }, [courseId]);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const totalQuestions =
    test?.sections.reduce((n, s) => n + s.questions.length, 0) ?? 0;
  const answeredCount = Object.keys(answers).length;
  const allAnswered = totalQuestions > 0 && answeredCount === totalQuestions;

  const handleSubmit = useCallback(() => {
    if (!test || !allAnswered) return;
    setPhase("grading");
    const payload = Object.entries(answers).map(([questionId, selected]) => ({
      questionId,
      selected: [selected],
    }));
    submitPlacement(courseId, test.attemptId, payload)
      .then((r) => {
        setResult(r);
        setPhase("result");
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Could not grade the test.");
        setPhase("error");
      });
  }, [test, allAnswered, answers, courseId]);

  const handleAddToCart = useCallback(() => {
    if (!test || !result) return;
    setAdding(true);
    addRecommendedToCart(courseId, test.attemptId)
      .then(() => router.push("/cart"))
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Could not add to cart.");
        setAdding(false);
      });
  }, [test, result, courseId, router]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-xl max-h-[88vh] overflow-hidden flex flex-col rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-violet-700 to-violet-600">
          <div>
            <h2 className="text-white text-[17px] font-bold flex items-center gap-2">
              <SparkIcon /> AI Placement Test
            </h2>
            <p className="text-violet-100 text-[12.5px] mt-0.5">
              Find out which sections you can skip — buy only what you need.
            </p>
          </div>
          <Button
            variant="ghostOnColor"
            size="icon"
            onClick={onClose}
            aria-label="Close"
            className="text-xl leading-none"
          >
            ✕
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {phase === "loading" && (
            <div className="py-16 flex flex-col items-center text-center">
              <Spinner large />
              <p className="mt-4 text-slate-700 font-semibold text-[14px]">
                Building your test…
              </p>
              <p className="text-slate-400 text-[12.5px] mt-1">
                Generating questions from this course&apos;s content.
              </p>
            </div>
          )}

          {phase === "error" && (
            <div className="py-12 text-center">
              <p className="text-red-500 font-semibold text-[14px]">{error}</p>
              <Button
                variant="neutral"
                size="sm"
                onClick={onClose}
                className="mt-5"
              >
                Close
              </Button>
            </div>
          )}

          {phase === "quiz" && test && (
            <div className="space-y-7">
              {test.sections.map((section, si) => (
                <div key={section.sectionId}>
                  <p className="text-[11px] font-bold text-violet-600 uppercase tracking-widest mb-2">
                    Section {si + 1} · {section.title}
                  </p>
                  <div className="space-y-5">
                    {section.questions.map((q) => (
                      <fieldset key={q.id}>
                        <legend className="text-[13.5px] font-semibold text-slate-800 mb-2">
                          {q.questionText}
                        </legend>
                        <div className="space-y-2">
                          {q.options.map((opt) => {
                            const checked = answers[q.id] === opt;
                            return (
                              <label
                                key={opt}
                                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border cursor-pointer text-[13px] transition-all ${
                                  checked
                                    ? "border-violet-500 bg-violet-50 text-slate-900"
                                    : "border-slate-200 hover:border-violet-300 text-slate-600"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={q.id}
                                  value={opt}
                                  checked={checked}
                                  onChange={() =>
                                    setAnswers((p) => ({ ...p, [q.id]: opt }))
                                  }
                                  className="accent-violet-600"
                                />
                                {opt}
                              </label>
                            );
                          })}
                        </div>
                      </fieldset>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {phase === "grading" && (
            <div className="py-16 flex flex-col items-center text-center">
              <Spinner large />
              <p className="mt-4 text-slate-700 font-semibold text-[14px]">
                Scoring your answers…
              </p>
            </div>
          )}

          {phase === "result" && result && (
            <ResultView result={result} />
          )}
        </div>

        {/* Footer */}
        {phase === "quiz" && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-4">
            <span className="text-[12px] text-slate-400">
              {answeredCount}/{totalQuestions} answered
            </span>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              disabled={!allAnswered}
            >
              See my recommendation
            </Button>
          </div>
        )}

        {phase === "result" && result && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button variant="neutral" size="sm" onClick={onClose}>
              {result.mode === "none" ? "Close" : "Not now"}
            </Button>
            {result.mode !== "none" && (
              <Button
                onClick={handleAddToCart}
                loading={adding}
              >
                {result.mode === "full"
                  ? `Add full course — EGP${result.coursePrice}`
                  : `Add ${result.sections.length} section${result.sections.length > 1 ? "s" : ""} — EGP${result.totalPrice}`}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ResultView({ result }: { result: PlacementRecommendation }) {
  return (
    <div>
      {/* Headline */}
      <div className="rounded-xl bg-violet-50 border border-violet-100 px-4 py-3.5 mb-5">
        <p className="text-[14px] font-semibold text-violet-900">
          {result.message}
        </p>
        {result.mode === "sections" && result.savings > 0 && (
          <p className="text-[12.5px] text-emerald-700 font-semibold mt-1">
            You save ${result.savings} vs. the full course (${result.coursePrice}).
          </p>
        )}
      </div>

      {/* Per-section breakdown */}
      <div className="space-y-2.5">
        {result.results.map((r) => (
          <div
            key={r.sectionId}
            className="flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl border border-slate-100"
          >
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-slate-800 truncate">
                {r.title}
              </p>
              <p className="text-[11.5px] text-slate-400">
                Scored {r.score}% ({r.correct}/{r.total})
              </p>
            </div>
            {r.mastered ? (
              <span className="shrink-0 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                ✓ You know this — skip
              </span>
            ) : (
              <span className="shrink-0 text-[11px] font-bold text-violet-700 bg-violet-50 px-2.5 py-1 rounded-full">
                Recommended{typeof r.price === "number" ? ` · EGP${r.price}` : ""}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Spinner({ large }: { large?: boolean }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${
        large ? "w-7 h-7 text-violet-600" : "w-4 h-4 text-white"
      }`}
      role="status"
      aria-label="Loading"
    />
  );
}

function SparkIcon() {
  return (
    <svg
      className="w-[18px] h-[18px]"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 2l1.9 5.7L20 9.5l-5.1 2L12 17l-1.9-5.5L5 9.5l5.1-1.8L12 2z" />
    </svg>
  );
}
