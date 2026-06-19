"use client";
// _components/LessonItem.tsx

import type { PlayerLesson } from "@/types/player";

interface Props {
  lesson: PlayerLesson;
  index: number;
  isActive: boolean;
  isForceLockedBySection: boolean;
  onClick: (lesson: PlayerLesson) => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ── State icons ───────────────────────────────────────────────────────────────

function CompletedIcon() {
  return (
    <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
      <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
        <path d="M5 13l4 4L19 7" />
      </svg>
    </span>
  );
}

function InProgressIcon() {
  return (
    <span className="w-5 h-5 rounded-full bg-[#3B1892] flex items-center justify-center flex-shrink-0">
      <svg className="w-2.5 h-2.5 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z" />
      </svg>
    </span>
  );
}

function AvailableIcon() {
  return (
    <span className="w-5 h-5 rounded-full border-2 border-slate-300 flex-shrink-0" />
  );
}

function LockedIcon() {
  return (
    <span className="w-5 h-5 flex items-center justify-center flex-shrink-0">
      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </svg>
    </span>
  );
}

export default function LessonItem({
  lesson,
  index,
  isActive,
  isForceLockedBySection,
  onClick,
}: Props) {
  const effectiveState = isForceLockedBySection ? "locked" : lesson.state;
  const isClickable =
    effectiveState === "available" || effectiveState === "completed";

  const handleClick = () => {
    if (isClickable) onClick(lesson);
  };

  // ── State-driven styles ──────────────────────────────────────────────────
  const containerClass = [
    "group flex items-start gap-3 py-3 min-h-[52px] transition-colors duration-150",
    isActive
      ? "bg-violet-50 border-l-4 border-[#3B1892] pl-3 pr-4"
      : "border-l-4 border-transparent px-4",
    effectiveState === "locked"
      ? "opacity-50 cursor-default"
      : isClickable
        ? "hover:bg-slate-50 cursor-pointer"
        : "cursor-default",
  ]
    .filter(Boolean)
    .join(" ");

  const titleClass = [
    "text-[13px] leading-snug line-clamp-2 flex-1",
    isActive
      ? "font-bold text-[#3B1892]"
      : effectiveState === "completed"
        ? "text-slate-400"
        : effectiveState === "in_progress"
          ? "font-bold text-slate-800"
          : "text-slate-700",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClass} onClick={handleClick} role={isClickable ? "button" : undefined} tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => { if (e.key === "Enter" || e.key === " ") handleClick(); } : undefined}
      aria-label={isClickable ? `Play lesson: ${lesson.title}` : undefined}
    >
      {/* State icon */}
      <div className="mt-[2px]">
        {effectiveState === "completed" && <CompletedIcon />}
        {effectiveState === "in_progress" && <InProgressIcon />}
        {effectiveState === "available" && <AvailableIcon />}
        {effectiveState === "locked" && <LockedIcon />}
      </div>

      {/* Title + meta */}
      <div className="flex-1 min-w-0">
        <p className={titleClass}>
          <span className="text-slate-400 text-[12px] mr-1">{index}.</span>
          {lesson.title}
        </p>
        {lesson.videoDuration > 0 && (
          <span className="text-[11px] text-slate-400 mt-0.5 block tabular-nums">
            {formatDuration(lesson.videoDuration)}
          </span>
        )}
      </div>
    </div>
  );
}
