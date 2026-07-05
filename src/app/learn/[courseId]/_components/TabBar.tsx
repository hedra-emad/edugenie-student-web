"use client";
// _components/TabBar.tsx

import { useState } from "react";
import type { PlayerLesson } from "@/types/player";
import Button from "@/components/ui/Button";
import NotesSidebar from "./NotesSidebar";

interface Props {
  lesson: PlayerLesson;
  nextLesson: { id: string; title: string; videoDuration: number } | null;
  getCurrentTime: () => number;
  onSeekTo: (seconds: number) => void;
  onNextLesson: () => void;
}

type Tab = "overview" | "notes";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "notes", label: "Notes" },
];

// ── AI Chat panel (extracted for top-row layout) ─────────────────────────────

export function AIChatPanel() {
  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-700">
      <div className="px-4 py-3 border-b border-slate-200 flex-shrink-0">
        <p className="text-sm font-semibold text-slate-800">AI Assistant</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        <p className="text-slate-400 text-sm text-center mt-8">
          Ask anything about this lesson
        </p>
      </div>

      <div className="border-t border-slate-200 px-3 py-2.5 flex-shrink-0 flex items-center gap-2">
        <input
          type="text"
          disabled
          placeholder="Ask about this lesson..."
          className="flex-1 bg-slate-50 text-slate-800 text-sm rounded-lg px-3 py-2
                     border border-slate-200 outline-none placeholder:text-slate-400"
        />
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled
          className="flex-shrink-0"
        >
          Send
        </Button>
      </div>
    </div>
  );
}

// ── Main (Overview + Notes tabs) ────────────────────────────────────────────

export default function TabBar({
  lesson,
  nextLesson,
  getCurrentTime,
  onSeekTo,
  onNextLesson,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  return (
    <div className="bg-white flex flex-col h-full">
      {/* Tab strip */}
      <div className="flex border-b border-slate-200 shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 text-[13px] font-semibold transition-colors focus:outline-none rounded-none
                        ${activeTab === tab.id
                          ? "border-b-2 border-[#3B1892] text-[#3B1892]"
                          : "text-slate-500 hover:text-slate-700"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {activeTab === "overview" && (
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-1">
              {lesson.title}
            </h2>
            {lesson.transcript && (
              <p className="text-sm text-slate-600 leading-relaxed line-clamp-4">
                {lesson.transcript}
              </p>
            )}

            {nextLesson && (
              <>
                <div className="border-t border-slate-100 my-4" />
                <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-400 uppercase">
                      Up Next
                    </p>
                    <p className="text-sm font-semibold text-slate-800 line-clamp-1">
                      {nextLesson.title}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={onNextLesson}
                    className="shrink-0"
                  >
                    Next
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "notes" && (
          <NotesSidebar
            lessonId={lesson.id}
            getCurrentTime={getCurrentTime}
            onSeekTo={onSeekTo}
          />
        )}
      </div>
    </div>
  );
}
