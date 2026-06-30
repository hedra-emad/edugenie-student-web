// Graded section quiz. Passing at 80% unlocks the next section.
// In Next 16 `params` is a Promise and must be awaited.

import SectionQuizClient from "./SectionQuizClient";

export default async function SectionQuizPage({
  params,
}: {
  params: Promise<{ courseId: string; sectionId: string }>;
}) {
  const { courseId, sectionId } = await params;
  return <SectionQuizClient courseId={courseId} sectionId={sectionId} />;
}
