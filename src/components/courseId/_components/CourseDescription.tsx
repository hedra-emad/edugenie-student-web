// _components/CourseDescription.tsx
"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

interface Props {
  description: string;
  requirements: string[];
}

export default function CourseDescription({ description, requirements }: Props) {
  const [expanded, setExpanded] = useState(false);
  const isLong = description.length > 300;

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-6">

      {/* Description */}
      <div>
        <h2 className="text-[15px] font-bold text-slate-900 mb-3">Description</h2>
        <div className="relative">
          <p className={`text-[13.5px] text-slate-600 leading-relaxed ${!expanded && isLong ? "line-clamp-4" : ""}`}>
            {description}
          </p>
          {!expanded && isLong && (
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent" />
          )}
        </div>
        {isLong && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded((v) => !v)}
            className="mt-2"
          >
            {expanded ? "Show less" : "Show more"}
          </Button>
        )}
      </div>

      {/* Requirements */}
      {requirements.length > 0 && (
        <div>
          <h3 className="text-[14px] font-bold text-slate-900 mb-3">Requirements</h3>
          <ul className="flex flex-col gap-2">
            {requirements.map((req, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[13.5px] text-slate-600">
                <span className="mt-[6px] w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0" />
                {req}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}