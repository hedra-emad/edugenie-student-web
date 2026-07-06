"use client";
// Header coach entry point: a badge pill (streak flame + level chip + a red dot
// for unfinished missions), a click-to-open popup panel, and a once-a-day
// auto-appearing encouragement bubble. Reads the Daily Missions agent's data via
// the proxy. Rendered only for authenticated students (gated in Header).

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getCoachMissions,
  getCoachSnapshot,
  type CoachMissions,
  type CoachSnapshot,
} from "@/lib/api/coach";
import { SparkleIcon } from "@/components/ai/chatUi";

const NUDGE_KEY = "edugenie.coachNudge";
const today = () => new Date().toISOString().slice(0, 10);

interface CoachData {
  missions: CoachMissions | null;
  snapshot: CoachSnapshot | null;
}

/** Encouraging one-liner shown in the bubble + panel header. Pure (unit-tested). */
export function coachHeadline({ missions, snapshot }: CoachData): string {
  const streak = snapshot?.streak.current ?? 0;
  if (missions) {
    const left = missions.total - missions.doneCount;
    if (missions.total > 0 && missions.allDone) return "All missions cleared today 🎉";
    if (snapshot?.streak.activeToday && streak > 0)
      return `🔥 ${streak}-day streak — ${left} to go today`;
    if (streak > 0) return `Keep your ${streak}-day streak alive — one lesson today`;
    if (left > 0) return `You have ${left} mission${left === 1 ? "" : "s"} today`;
    return missions.note || "Your coach has today's plan ready";
  }
  return "Your coach has today's plan ready";
}

function FlameIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
      <path d="M12 2s4 4 4 8a4 4 0 0 1-8 0c0-1 .3-1.8.6-2.4C7 8 6 9.6 6 12a6 6 0 0 0 12 0c0-4.4-6-10-6-10z" />
    </svg>
  );
}

export default function CoachWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [nudge, setNudge] = useState(false);
  const [fading, setFading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data } = useQuery<CoachData>({
    queryKey: ["coach-widget"],
    queryFn: async () => {
      const [missions, snapshot] = await Promise.all([
        getCoachMissions(),
        getCoachSnapshot(),
      ]);
      return { missions, snapshot };
    },
    staleTime: 60_000,
  });

  const missions = data?.missions ?? null;
  const snapshot = data?.snapshot ?? null;
  const streak = snapshot?.streak.current ?? 0;
  const level = missions?.level ?? 1;
  const left = missions ? missions.total - missions.doneCount : 0;
  const headline = coachHeadline({ missions, snapshot });

  // Close the panel on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Auto-nudge once per day (not on the coach page itself).
  useEffect(() => {
    if (!data || pathname?.startsWith("/coach")) return;
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(NUDGE_KEY);
    } catch {
      /* private mode / disabled storage — just skip the guard */
    }
    if (stored === today()) return;
    try {
      localStorage.setItem(NUDGE_KEY, today());
    } catch {
      /* ignore */
    }
    setNudge(true);
    const fade = setTimeout(() => setFading(true), 7000);
    const hide = setTimeout(() => setNudge(false), 8000);
    return () => {
      clearTimeout(fade);
      clearTimeout(hide);
    };
  }, [data, pathname]);

  const openPanel = () => {
    setNudge(false);
    setOpen((v) => !v);
  };

  return (
    <div ref={ref} className="relative">
      {/* Trigger pill */}
      <button
        type="button"
        onClick={openPanel}
        aria-label="Learning coach"
        aria-expanded={open}
        className="relative flex min-h-[44px] items-center gap-1.5 rounded-lg px-2 text-gray-600 transition-colors duration-150 hover:bg-gray-100 hover:text-indigo-700"
      >
        <SparkleIcon className="h-5 w-5" />
        {streak > 0 && (
          <span className="flex items-center gap-0.5 text-[12px] font-bold text-orange-500">
            <FlameIcon className="h-3.5 w-3.5" />
            {streak}
          </span>
        )}
        <span className="hidden rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-[#3B1892] sm:inline">
          Lvl {level}
        </span>
        {left > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-1 -right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white"
          >
            {left > 9 ? "9+" : left}
          </span>
        )}
      </button>

      {/* Auto-nudge bubble */}
      {nudge && !open && (
        <div
          className={`absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-3 shadow-lg transition-opacity duration-700 ${
            fading ? "opacity-0" : "opacity-100"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-[13px] font-semibold text-slate-800">{headline}</p>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => setNudge(false)}
              className="-mr-1 -mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
            >
              ✕
            </button>
          </div>
          <button
            type="button"
            onClick={openPanel}
            className="mt-2 text-[12px] font-bold text-[#3B1892] hover:underline"
          >
            See today's missions →
          </button>
        </div>
      )}

      {/* Popup panel */}
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-100 bg-gradient-to-r from-violet-50 to-white px-4 py-3">
            <p className="text-[13.5px] font-bold text-slate-900">{headline}</p>
            <p className="mt-1 flex items-center gap-2 text-[11.5px] font-medium text-slate-400">
              {streak > 0 && (
                <span className="flex items-center gap-0.5 text-orange-500">
                  <FlameIcon className="h-3 w-3" />
                  {streak}d
                </span>
              )}
              <span>Lvl {level}</span>
              {missions && (
                <span>
                  {missions.doneCount}/{missions.total} today
                </span>
              )}
            </p>
          </div>

          <div className="max-h-72 overflow-y-auto py-1">
            {missions && missions.missions.length > 0 ? (
              missions.missions.map((m) => {
                const href =
                  !m.done && m.type === "resume_course" && m.courseId
                    ? `/learn/${m.courseId}`
                    : "/coach";
                return (
                  <Link
                    key={m.key}
                    href={href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 transition-colors hover:bg-slate-50"
                  >
                    <span
                      className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full ${
                        m.done ? "bg-emerald-500 text-white" : "border-2 border-slate-300"
                      }`}
                    >
                      {m.done && (
                        <svg
                          className="h-2.5 w-2.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={3.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      )}
                    </span>
                    <span
                      className={`min-w-0 flex-1 truncate text-[12.5px] font-medium ${
                        m.done ? "text-slate-400 line-through" : "text-slate-700"
                      }`}
                    >
                      {m.label}
                    </span>
                    <span className="flex-shrink-0 text-[10px] font-bold text-[#3B1892]">
                      +{m.xp}
                    </span>
                  </Link>
                );
              })
            ) : (
              <p className="px-4 py-4 text-center text-[12.5px] text-slate-400">
                Your coach is preparing today's missions.
              </p>
            )}
          </div>

          <div className="border-t border-slate-100 p-2">
            <Link
              href="/coach"
              onClick={() => setOpen(false)}
              className="flex w-full items-center justify-center rounded-xl bg-[#3B1892] py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#2e1370]"
            >
              Open coach →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
