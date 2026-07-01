"use client";

import { useState, useMemo } from "react";
import { useEnrollments } from "@/hooks/useEnrollments";
import CourseProgressCard, { CourseProgressCardSkeleton } from "./CourseProgressCard";
import LearningEmptyState from "./LearningEmptyState";

type Tab = "all" | "in-progress" | "completed";

const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "in-progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
];

export default function MyLearning() {
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const { data: courses = [], isLoading } = useEnrollments();

  const filtered = useMemo(() => {
    const done = (c: (typeof courses)[number]) =>
      c.isCompleted ?? c.progressPercent === 100;
    if (activeTab === "in-progress") {
      return courses.filter((c) => c.progressPercent > 0 && !done(c));
    }
    if (activeTab === "completed") {
      return courses.filter(done);
    }
    return courses;
  }, [courses, activeTab]);

  return (
    <section aria-label="My Learning courses">
      {/* Sub-tabs */}
      <div
        className="flex gap-0 border-b border-slate-200 mb-6"
        role="tablist"
        aria-label="Course filter tabs"
      >
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={active}
              aria-controls={`tabpanel-${tab.key}`}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium transition-colors duration-150 border-b-2 -mb-px
                ${
                  active
                    ? "border-[#3B1892] text-[#3B1892]"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
            >
              {tab.label}
              {tab.key === "all" && courses.length > 0 && (
                <span className="ml-1.5 text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">
                  {courses.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div
        id={`tabpanel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
      >
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <CourseProgressCardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <LearningEmptyState />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((course) => (
              <CourseProgressCard key={course.courseId} course={course} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
