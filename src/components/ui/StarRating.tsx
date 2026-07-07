"use client";

import { useState } from "react";
import { Star } from "lucide-react";

export interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  readOnly?: boolean;
}

/** Compact, clickable 1-5 star input. Amber fill matches the rating display used in CourseHero. */
export default function StarRating({
  value,
  onChange,
  size = 16,
  readOnly = false,
}: StarRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const display = hovered ?? value;

  return (
    <div
      className="flex items-center gap-0.5"
      onMouseLeave={() => setHovered(null)}
      role={readOnly ? undefined : "radiogroup"}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(n)}
          onMouseEnter={() => !readOnly && setHovered(n)}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          className={`p-0.5 -m-0.5 ${readOnly ? "cursor-default" : "cursor-pointer"} disabled:opacity-100`}
        >
          <Star
            size={size}
            fill={n <= display ? "#F59E0B" : "none"}
            className={n <= display ? "text-amber-500" : "text-slate-300"}
            strokeWidth={1.75}
          />
        </button>
      ))}
    </div>
  );
}
