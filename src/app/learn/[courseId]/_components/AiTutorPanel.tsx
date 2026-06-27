"use client";
// _components/AiTutorPanel.tsx
// In-player AI tutor with a scope toggle:
//   • "This lesson"  → Tier-1 lesson_chat (grounded in the active lesson)
//   • "This course"  → Tier-2 course_chat (spans every unlocked section)
// Both stream over the NestJS `/ai` WebSocket via the shared useAiChat hook.

import { useEffect, useRef, useState } from "react";
import { useAiChat } from "@/lib/ai/useAiChat";
import {
  MessageBubble,
  SparkleIcon,
  SendIcon,
  RefreshIcon,
  StateNotice,
} from "@/components/ai/chatUi";

interface Props {
  courseId: string;
  courseTitle: string;
  lessonId: string;
  lessonTitle: string;
}

type Scope = "lesson" | "course";

const SUGGESTIONS: Record<Scope, string[]> = {
  lesson: [
    "Summarize this lesson",
    "Explain it like I'm a beginner",
    "Give me a real-world example",
    "Quiz me on the key points",
  ],
  course: [
    "What should I focus on in this course?",
    "How do these lessons connect?",
    "Recap what I've learned so far",
    "What concepts should I review?",
  ],
};

export default function AiTutorPanel({
  courseId,
  courseTitle,
  lessonId,
  lessonTitle,
}: Props) {
  const [scope, setScope] = useState<Scope>("lesson");
  const [input, setInput] = useState("");

  // The hook re-keys (resets + reconnects) whenever `resetKey` changes — so
  // switching scope, or switching lessons while in lesson scope, starts fresh.
  // Course scope is keyed only by courseId, so it survives lesson changes.
  const config =
    scope === "lesson"
      ? {
          event: "lesson_chat" as const,
          context: { lessonId },
          resetKey: `lesson:${lessonId}`,
        }
      : {
          event: "course_chat" as const,
          context: { courseId },
          resetKey: `course:${courseId}`,
        };

  const { messages, connection, isStreaming, send, reset, reconnect } =
    useAiChat(config);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const canSend =
    connection === "connected" && !isStreaming && input.trim().length > 0;

  const submit = (text: string) => {
    if (connection !== "connected" || isStreaming) return;
    const value = text.trim();
    if (!value) return;
    send(value);
    setInput("");
    inputRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSend) submit(input);
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-full min-h-[440px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#3B1892] to-[#5B3DB8] text-white shadow-sm">
            <SparkleIcon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-semibold leading-tight text-slate-800">
              AI Tutor
            </p>
            <p className="flex items-center gap-1.5 text-[11px] leading-tight text-slate-400">
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${
                  connection === "connected"
                    ? "bg-green-500"
                    : connection === "connecting"
                      ? "animate-pulse bg-amber-400"
                      : "bg-slate-300"
                }`}
              />
              {connection === "connected"
                ? scope === "lesson"
                  ? "Grounded in this lesson"
                  : "Spanning the whole course"
                : connection === "connecting"
                  ? "Connecting…"
                  : "Offline"}
            </p>
          </div>
        </div>

        {!isEmpty && (
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11.5px] font-medium text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Clear conversation"
          >
            <RefreshIcon className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Scope toggle */}
      <div className="flex flex-shrink-0 gap-1 border-b border-slate-100 bg-slate-50/70 px-3 py-2">
        {(["lesson", "course"] as Scope[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setScope(s)}
            className={`flex-1 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all ${
              scope === s
                ? "bg-white text-[#3B1892] shadow-sm ring-1 ring-slate-200"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {s === "lesson" ? "This lesson" : "This course"}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {connection === "unauthenticated" ? (
          <StateNotice
            title="Sign in to use the AI tutor"
            body="Your session has expired. Please log in again to continue."
          />
        ) : connection === "error" ? (
          <StateNotice
            title="Couldn't reach the AI tutor"
            body="The assistant is temporarily unavailable."
            action={{ label: "Try again", onClick: reconnect }}
          />
        ) : isEmpty ? (
          <EmptyState
            scope={scope}
            lessonTitle={lessonTitle}
            courseTitle={courseTitle}
            onPick={submit}
            disabled={connection !== "connected"}
          />
        ) : (
          messages.map((m) => <MessageBubble key={m.id} message={m} />)
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-shrink-0 items-center gap-2 border-t border-slate-100 px-3 py-3"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={connection !== "connected"}
          placeholder={
            connection === "connected"
              ? scope === "lesson"
                ? "Ask about this lesson…"
                : "Ask about this course…"
              : "Connecting…"
          }
          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-[13.5px] text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-[#3B1892] focus:ring-1 focus:ring-[#3B1892] disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!canSend}
          className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-xl bg-[#3B1892] text-white transition-all hover:bg-[#2A1069] disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Send message"
        >
          <SendIcon className="h-[18px] w-[18px]" />
        </button>
      </form>
    </div>
  );
}

// ── Empty state (scope-aware) ────────────────────────────────────────────────

function EmptyState({
  scope,
  lessonTitle,
  courseTitle,
  onPick,
  disabled,
}: {
  scope: Scope;
  lessonTitle: string;
  courseTitle: string;
  onPick: (text: string) => void;
  disabled: boolean;
}) {
  const target = scope === "lesson" ? lessonTitle : courseTitle;
  return (
    <div className="flex h-full flex-col items-center justify-center px-2 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-violet-50 text-[#3B1892]">
        <SparkleIcon className="h-7 w-7" />
      </div>
      <p className="text-[15px] font-semibold text-slate-800">
        Your AI tutor is ready
      </p>
      <p className="mx-auto mt-1.5 max-w-[260px] text-[12.5px] leading-relaxed text-slate-500">
        {scope === "lesson" ? "Ask anything about" : "Ask anything across"}{" "}
        <span className="font-medium text-slate-600">“{target}”</span> — grounded
        in {scope === "lesson" ? "this lesson" : "the material you've unlocked"}.
      </p>

      <div className="mt-5 flex w-full flex-col gap-2">
        {SUGGESTIONS[scope].map((s) => (
          <button
            key={s}
            type="button"
            disabled={disabled}
            onClick={() => onPick(s)}
            className="group flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-left text-[13px] font-medium text-slate-600 transition-all hover:border-[#3B1892]/40 hover:bg-violet-50/40 hover:text-[#3B1892] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <SparkleIcon className="h-3.5 w-3.5 flex-shrink-0 text-slate-300 transition-colors group-hover:text-[#3B1892]" />
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
