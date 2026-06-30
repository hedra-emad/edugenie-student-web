// Graded section-quiz client. Passing this quiz at 80% is what unlocks the next
// section (see the backend CoursesService.applyStudentAccess gate). Calls go
// through the same-origin proxy so the JWT cookie is attached server-side.

const PROXY = process.env.NEXT_PUBLIC_API_BASE || "/api/proxy";

export interface QuizOption {
  optionId: string;
  text: string;
}

export interface QuizQuestionForStudent {
  questionId: string;
  text: string;
  /** SINGLE_CHOICE | MULTI_CHOICE | TRUE_FALSE */
  type: string;
  options: QuizOption[];
}

export interface SectionQuiz {
  quizId: string;
  timeLimit: number;
  passingScore: number;
  attemptNumber: number;
  maxAttempts: number;
  attemptsRemaining: number;
  /** SINGLE_CHOICE | MULTI_CHOICE | TRUE_FALSE | MIXED */
  questionType: string;
  questions: QuizQuestionForStudent[];
}

export interface QuizStart {
  attemptId: string;
  startedAt: string;
  timeLimit: number;
}

export interface QuizResult {
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

async function readError(res: Response): Promise<string> {
  const body = (await res.json().catch(() => ({}))) as { message?: unknown };
  const m = body.message;
  if (Array.isArray(m)) return m.join(", ");
  if (typeof m === "string") return m;
  return "Something went wrong. Please try again.";
}

export async function getSectionQuiz(sectionId: string): Promise<SectionQuiz> {
  const res = await fetch(`${PROXY}/sections/${sectionId}/quiz`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json() as Promise<SectionQuiz>;
}

export async function startSectionQuiz(sectionId: string): Promise<QuizStart> {
  const res = await fetch(`${PROXY}/sections/${sectionId}/quiz/start`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json() as Promise<QuizStart>;
}

export async function submitSectionQuiz(
  sectionId: string,
  attemptId: string,
  answers: SubmitAnswer[],
): Promise<QuizResult> {
  const res = await fetch(`${PROXY}/sections/${sectionId}/quiz/submit`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ attemptId, answers }),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json() as Promise<QuizResult>;
}
