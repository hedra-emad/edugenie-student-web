// src/app/roadmap/page.tsx
// Tier-3 AI advisor — a personalized, milestone-based learning roadmap.
// Requires an authenticated student (the WebSocket handshake needs the JWT).

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import RoadmapClient from "./_components/RoadmapClient";

export const metadata = {
  title: "Career Roadmap — EduGenie",
  description:
    "Build a personalized, step-by-step learning roadmap toward your career goal with EduGenie's AI advisor.",
};

export default async function RoadmapPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("jwt")?.value;

  if (!token) redirect("/login?next=/roadmap");

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#eef2f6]">
      <RoadmapClient />
    </div>
  );
}
