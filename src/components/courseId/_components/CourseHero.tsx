// _components/CourseHero.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Avatar from "@/components/ui/Avatar";
import PreviewVideoModal from "./PreviewVideoModal";
import type { Course } from "../../../app/courses/[courseId]/types/course";

function getSafeImageSrc(src: string | null | undefined): string | null {
  if (!src) return null;
  const trimmed = src.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("/")) return trimmed;
  if (!/^https?:\/\//i.test(trimmed)) return null;
  try {
    const { hostname } = new URL(trimmed);
    if (hostname === "example.com") return null;
    if (
      hostname === "res.cloudinary.com" ||
      hostname === "edugenie-api.vercel.app" ||
      hostname === "images.unsplash.com"
    ) {
      return trimmed;
    }
    return null;
  } catch {
    return null;
  }
}

const LEVEL_LABELS: Record<string, string> = {
  beginner:     "Beginner",
  intermediate: "Intermediate",
  advanced:     "Advanced",
};

const LEVEL_STYLES: Record<string, string> = {
  beginner:     "bg-emerald-50 text-emerald-700 border-emerald-200",
  intermediate: "bg-amber-50 text-amber-700 border-amber-200",
  advanced:     "bg-red-50 text-red-700 border-red-200",
};

function RatingStars({ rating }: { rating: number }) {
  const filled = Math.round(rating);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          className="w-3.5 h-3.5"
          viewBox="0 0 20 20"
          fill={n <= filled ? "#F59E0B" : "rgba(255,255,255,0.2)"}
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function MetaChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center border border-white/15 text-white/60 text-[12px] font-medium px-3 py-1.5 rounded-full bg-white/[0.06]">
      {label}
    </span>
  );
}

export default function CourseHero({ course }: { course: Course }) {
  const [showPreview, setShowPreview] = useState(false);
  const instructor = course.instructorId;
  const fullName   = `${instructor.firstName} ${instructor.lastName}`;
  const levelStyle = LEVEL_STYLES[course.level] ?? LEVEL_STYLES.beginner;
  const levelLabel = LEVEL_LABELS[course.level] ?? course.level;
  const safeThumbnail = getSafeImageSrc(course.thumbnail);
  const hasPreviewVideo = Boolean(course.previewVideoUrl?.trim());

  const hours   = Math.floor(course.totalHours);
  const minutes = Math.round((course.totalHours - hours) * 60);
  const durationLabel = hours > 0
    ? `${hours}h ${minutes > 0 ? `${minutes}m` : ""}`
    : `${minutes}m`;

  return (
    <div className="bg-slate-900 border-b border-slate-800">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10 py-10">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-[11.5px] text-white/35 mb-6 flex-wrap">
          <Link href="/" className="hover:text-white/60 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/courses" className="hover:text-white/60 transition-colors">Courses</Link>
          <span>/</span>
          <Link
            href={`/courses?category=${course.categoryId.slug}`}
            className="hover:text-white/60 transition-colors"
          >
            {course.categoryId.name}
          </Link>
          <span>/</span>
          <span className="text-white/50 line-clamp-1 max-w-[200px]">{course.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-start">

          {/* ── Left copy ── */}
          <div className="max-w-[640px]">

            {/* Level + Category */}
            <div className="flex items-center gap-2 mb-4">
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${levelStyle}`}>
                {levelLabel}
              </span>
              <span className="text-[11px] text-white/35 border border-white/10 px-2.5 py-1 rounded-full">
                {course.categoryId.name}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-[28px] font-extrabold text-white leading-tight tracking-tight mb-3">
              {course.title}
            </h1>

            {/* Short description */}
            <p className="text-[14px] text-white/50 leading-relaxed mb-5 line-clamp-2">
              {course.description}
            </p>

            {/* Rating row */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <div className="flex items-center gap-2">
                <RatingStars rating={course.ratingAverage} />
                <span className="text-[13px] font-bold text-amber-400">
                  {course.ratingAverage.toFixed(1)}
                </span>
              </div>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span className="text-[12px] text-white/40">
                {course.totalEnrollments.toLocaleString()} students
              </span>
            </div>

            {/* Meta chips */}
            <div className="flex flex-wrap gap-2 mb-6">
              <MetaChip label={`${course.totalLessons} lessons`} />
              <MetaChip label={durationLabel} />
              <MetaChip label="Certificate" />
              <MetaChip label="AI Chatbot" />
            </div>

            {/* Instructor */}
            <div className="flex items-center gap-3">
              <Avatar
                src={instructor.avatar}
                name={instructor.firstName}
                className="w-9 h-9 flex-shrink-0 border border-white/10"
                textSizeClassName="text-xs"
              />
              <p className="text-[13px] text-white/45">
                Created by{" "}
                <span className="text-violet-400 font-semibold">{fullName}</span>
              </p>
            </div>
          </div>

          {/* ── Right — thumbnail preview (desktop only, card handles mobile) ── */}
          <div className="hidden lg:block w-[260px] rounded-xl overflow-hidden border border-white/10 flex-shrink-0">
            <div className="relative aspect-video bg-slate-800">
              {safeThumbnail && (
                <Image
                  src={safeThumbnail}
                  alt={course.title}
                  fill
                  className="object-cover"
                  priority
                />
              )}
              {hasPreviewVideo && (
                <button
                  type="button"
                  aria-label="Watch preview"
                  onClick={() => setShowPreview(true)}
                  className="absolute inset-0 bg-black/40 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-slate-800 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      {showPreview && course.previewVideoUrl && (
        <PreviewVideoModal
          videoUrl={course.previewVideoUrl}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}