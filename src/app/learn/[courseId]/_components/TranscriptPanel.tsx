"use client";
// Clickable, time-coded transcript. Each segment seeks the video to its start
// (reusing the same imperative seek path the Notes timestamps use). The segment
// under the playhead is highlighted and auto-scrolled into view. Segments are
// native <button>s, so they're keyboard-focusable and fire on Enter/Space.

import { useEffect, useRef, useState } from "react";
import type { TranscriptSegment } from "@/types/player";
import { formatTime } from "@/lib/format-time";

interface Props {
  segments: TranscriptSegment[];
  onSeekTo: (seconds: number) => void;
  getCurrentTime: () => number;
}

export default function TranscriptPanel({ segments, onSeekTo, getCurrentTime }: Props) {
  const [activeIdx, setActiveIdx] = useState(-1);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  // Poll the playhead (the native <video> has no cheap per-segment event) and
  // mark the last segment that has started as active.
  useEffect(() => {
    const tick = () => {
      const t = getCurrentTime();
      let idx = -1;
      for (let i = 0; i < segments.length; i++) {
        if (segments[i].start <= t + 0.25) idx = i;
        else break;
      }
      setActiveIdx((prev) => (prev === idx ? prev : idx));
    };
    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
  }, [segments, getCurrentTime]);

  // Keep the active line in view (but don't fight the user's own scrolling by
  // jumping the whole page — nearest + smooth is gentle).
  useEffect(() => {
    if (activeIdx < 0) return;
    itemRefs.current[activeIdx]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeIdx]);

  return (
    <div className="h-full overflow-y-auto px-2 py-3">
      <ul className="space-y-0.5">
        {segments.map((seg, i) => {
          const active = i === activeIdx;
          return (
            <li key={`${seg.start}-${i}`}>
              <button
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                type="button"
                onClick={() => onSeekTo(seg.start)}
                aria-current={active || undefined}
                aria-label={`Jump to ${formatTime(seg.start)}`}
                className={`group flex w-full gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B1892]
                  ${active ? "bg-violet-50" : "hover:bg-slate-50"}`}
              >
                <span
                  className={`mt-0.5 shrink-0 font-mono text-[11px] tabular-nums transition-colors
                    ${active ? "font-bold text-[#3B1892]" : "text-slate-400 group-hover:text-[#3B1892]"}`}
                >
                  {formatTime(seg.start)}
                </span>
                <span
                  className={`text-[13px] leading-relaxed transition-colors
                    ${active ? "font-medium text-slate-900" : "text-slate-600"}`}
                >
                  {seg.text}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
