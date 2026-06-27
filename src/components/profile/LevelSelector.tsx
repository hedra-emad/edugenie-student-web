"use client";

import { Loader2 } from "lucide-react";
import type { UserProfile } from "@/types/profile.types";

const LEVELS: UserProfile["level"][] = ["beginner", "intermediate", "advanced"];
const LABELS: Record<UserProfile["level"], string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

interface Props {
  value: UserProfile["level"];
  onChange: (level: UserProfile["level"]) => void;
  isPending: boolean;
}

export default function LevelSelector({ value, onChange, isPending }: Props) {
  return (
    <div
      className="grid grid-cols-3 w-full rounded-lg overflow-hidden border border-slate-200"
      role="group"
      aria-label="Select your level"
    >
      {LEVELS.map((level) => {
        const active = value === level;
        return (
          <button
            key={level}
            type="button"
            onClick={() => !active && !isPending && onChange(level)}
            disabled={isPending}
            aria-pressed={active}
            className={`relative flex items-center justify-center gap-1.5 text-xs font-semibold py-2 transition-colors duration-150
              disabled:cursor-not-allowed
              ${
                active
                  ? "bg-[#3B1892] text-white"
                  : "bg-white text-slate-600 hover:border-[#3B1892] hover:text-[#3B1892]"
              }`}
          >
            {active && isPending ? (
              <Loader2 size={12} className="animate-spin" aria-hidden="true" />
            ) : null}
            {LABELS[level]}
          </button>
        );
      })}
    </div>
  );
}
