// Server Component — fetches categories SSR, passes to client

import { Suspense } from "react";
import { fetchCategories } from "@/lib/api/courses";
import CoursesPageClient from "./CoursesPageClient";

export const metadata = {
  title:       "All Courses — EduGenie",
  description: "Browse 800+ expert-led courses in development, design, data science and more.",
};

export default async function CoursesPage() {
  // Categories fetched SSR (revalidate 1h) — no waterfall on the client
  const categories = await fetchCategories();

  return (
    <Suspense>
      <CoursesPageClient categories={categories} />
    </Suspense>
  );
}