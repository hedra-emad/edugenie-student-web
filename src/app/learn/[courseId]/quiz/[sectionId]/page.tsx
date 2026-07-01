// learn/[courseId]/quiz/[sectionId]/page.tsx
// Graded section quiz — the 80% gate that unlocks the next owned section.
// Next.js 16: route params arrive as a Promise and must be awaited.

import SectionQuizClient from "./SectionQuizClient";

export default async function SectionQuizPage({
  params,
}: {
  params: Promise<{ courseId: string; sectionId: string }>;
}) {
  const { courseId, sectionId } = await params;
  return <SectionQuizClient courseId={courseId} sectionId={sectionId} />;
}
