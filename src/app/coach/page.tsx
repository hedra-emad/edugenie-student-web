// src/app/coach/page.tsx
// Tier-4 AI Learning Coach — grounded in the student's real progress + quiz
// results. Requires an authenticated student (the coach reads their data).

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import CoachClient from "./_components/CoachClient";

export const metadata = {
  title: "AI Learning Coach — EduGenie",
  description:
    "Your personal AI coach reads your real progress and quiz results, then tells you exactly what to focus on next.",
};

export default async function CoachPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("jwt")?.value;

  if (!token) redirect("/login?next=/coach");

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#eef2f6]">
      <CoachClient />
    </div>
  );
}
