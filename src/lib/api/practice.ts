// Practice "Quiz Me" client — generate a targeted quiz for a section and submit
// it for instant grading. Calls go through the same-origin proxy, which adds the
// JWT httpOnly cookie.

const PROXY = process.env.NEXT_PUBLIC_API_BASE || "/api/proxy";

export interface PracticeQuestion {
  id: string;
  questionText: string;
  type: string;
  options: string[];
}

export interface PracticeQuiz {
  practiceId: string;
  courseTitle: string;
  sectionTitle: string;
  difficulty: string;
  questions: PracticeQuestion[];
}

export interface PracticeResultItem {
  id: string;
  questionText: string;
  options: string[];
  yourAnswer: string[];
  correctAnswer: string[];
  isCorrect: boolean;
}

export interface PracticeResult {
  practiceId: string;
  courseTitle: string;
  sectionTitle: string;
  score: number;
  correct: number;
  total: number;
  passed: boolean;
  results: PracticeResultItem[];
}

async function readError(res: Response): Promise<string> {
  const body = (await res.json().catch(() => ({}))) as { message?: unknown };
  const m = body.message;
  if (Array.isArray(m)) return m.join(", ");
  if (typeof m === "string") return m;
  return "Something went wrong. Please try again.";
}

export async function generatePracticeQuiz(input: {
  sectionId: string;
  difficulty?: "EASY" | "MEDIUM" | "HARD";
  numberOfQuestions?: number;
}): Promise<PracticeQuiz> {
  const res = await fetch(`${PROXY}/ai/practice-quiz`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json() as Promise<PracticeQuiz>;
}

export async function submitPracticeQuiz(
  practiceId: string,
  answers: { questionId: string; selected: string[] }[],
): Promise<PracticeResult> {
  const res = await fetch(`${PROXY}/ai/practice-quiz/${practiceId}/submit`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers }),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json() as Promise<PracticeResult>;
}
