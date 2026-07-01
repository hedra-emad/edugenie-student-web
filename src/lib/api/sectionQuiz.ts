// src/lib/api/sectionQuiz.ts
// Client for the *graded* section quiz that gates section progression.
// Distinct from the AI practice quiz (PracticeQuizModal) — this one counts
// toward the 80% pass gate. All calls go through the authenticated proxy.

const PROXY = "/api/proxy";

export interface QuizOption {
  optionId: string;
  text: string;
}

export interface SectionQuizQuestion {
  questionId: string;
  text: string;
  /** SINGLE_CHOICE | MULTI_CHOICE | TRUE_FALSE | MIXED — drives the input UI. */
  type: string;
  options: QuizOption[];
}

export interface SectionQuiz {
  quizId: string;
  timeLimit: number; // minutes
  passingScore: number; // percent
  attemptNumber: number;
  maxAttempts: number;
  attemptsRemaining: number;
  questionType: string;
  questions: SectionQuizQuestion[];
}

export interface QuizStart {
  attemptId: string;
  startedAt: string;
  timeLimit: number;
}

export interface QuizSubmitResult {
  passed: boolean;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  attemptNumber: number;
  remainingAttempts: number;
  progressReset: boolean;
  nextSectionUnlocked: boolean;
}

export interface SubmitAnswer {
  questionId: string;
  selectedOptionIds: string[];
}

async function unwrap<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      (json && (json.message || json.error)) ||
      `Request failed (${res.status})`;
    throw new Error(
      Array.isArray(message) ? message.join(", ") : String(message),
    );
  }
  return (json.data ?? json) as T;
}

/** Fetch quiz metadata + questions. Does NOT consume an attempt. */
export async function getSectionQuiz(sectionId: string): Promise<SectionQuiz> {
  const res = await fetch(
    `${PROXY}/sections/${encodeURIComponent(sectionId)}/quiz`,
    { credentials: "include", cache: "no-store" },
  );
  return unwrap<SectionQuiz>(res);
}

/** Begin an attempt — consumes an attempt and starts the timer. */
export async function startSectionQuiz(sectionId: string): Promise<QuizStart> {
  const res = await fetch(
    `${PROXY}/sections/${encodeURIComponent(sectionId)}/quiz/start`,
    { method: "POST", credentials: "include" },
  );
  return unwrap<QuizStart>(res);
}

/** Submit answers for grading. */
export async function submitSectionQuiz(
  sectionId: string,
  attemptId: string,
  answers: SubmitAnswer[],
): Promise<QuizSubmitResult> {
  const res = await fetch(
    `${PROXY}/sections/${encodeURIComponent(sectionId)}/quiz/submit`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attemptId, answers }),
    },
  );
  return unwrap<QuizSubmitResult>(res);
}

/** True when a question accepts multiple selections. */
export function isMultiSelect(type: string): boolean {
  return type === "MULTI_CHOICE" || type === "MIXED";
}
