"use client";
// _components/RoadmapClient.tsx
// Tier-3 global advisor — builds a personalized, milestone-based learning
// roadmap from the student's profile + stated goal. Streams over the NestJS
// `/ai` WebSocket via the shared useAiChat hook.

import { useEffect, useRef, useState } from "react";
import { useAiChat } from "@/lib/ai/useAiChat";
import {
  MessageBubble,
  StateNotice,
  SendIcon,
  RefreshIcon,
  RouteIcon,
} from "@/components/ai/chatUi";

const GOAL_IDEAS = [
  "Become a full-stack web developer",
  "Break into data science",
  "Land a UI/UX design role",
  "Prepare for a backend engineering job",
];

export default function RoadmapClient({ firstName = "" }: { firstName?: string }) {
  const [goal, setGoal] = useState("");
  const [input, setInput] = useState("");

  const { messages, connection, isStreaming, send, reset, reconnect } = useAiChat({
    event: "roadmap_chat",
    context: { goal },
    resetKey: "roadmap",
  });

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
    // Remember the first stated goal so it grounds every later follow-up.
    if (!goal) setGoal(value);
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
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-10">
      {/* Hero */}
      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#3B1892] to-[#5B3DB8] text-white shadow-md">
          <RouteIcon className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-slate-900">
            Career Roadmap Advisor
          </h1>
          <p className="mt-1 max-w-xl text-[13.5px] leading-relaxed text-slate-500">
            Tell me where you want to go{firstName ? `, ${firstName}` : ""}, and
            I&apos;ll map a step-by-step learning path — tailored to your skills,
            interests, and level.
          </p>
        </div>
      </div>

      {/* Chat card */}
      <div className="flex h-[68vh] min-h-[460px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Connection strip */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-100 px-4 py-2.5">
          <p className="flex items-center gap-1.5 text-[11.5px] font-medium text-slate-400">
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
              ? goal
                ? `Goal: ${goal}`
                : "Ready"
              : connection === "connecting"
                ? "Connecting…"
                : "Offline"}
          </p>
          {!isEmpty && (
            <button
              type="button"
              onClick={() => {
                setGoal("");
                reset();
              }}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11.5px] font-medium text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <RefreshIcon className="h-3.5 w-3.5" />
              New roadmap
            </button>
          )}
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
          {connection === "unauthenticated" ? (
            <StateNotice
              title="Sign in to use the advisor"
              body="Your session has expired. Please log in again to build your roadmap."
            />
          ) : connection === "error" ? (
            <StateNotice
              title="Couldn't reach the advisor"
              body="The assistant is temporarily unavailable."
              action={{ label: "Try again", onClick: reconnect }}
            />
          ) : isEmpty ? (
            <EmptyState onPick={submit} disabled={connection !== "connected"} />
          ) : (
            messages.map((m) => <MessageBubble key={m.id} message={m} />)
          )}
        </div>

        {/* Composer */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-shrink-0 items-center gap-2 border-t border-slate-100 px-3 py-3 sm:px-4"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={connection !== "connected"}
            placeholder={
              connection === "connected"
                ? goal
                  ? "Ask a follow-up about your roadmap…"
                  : "Describe your goal…"
                : "Connecting…"
            }
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-[#3B1892] focus:ring-1 focus:ring-[#3B1892] disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!canSend}
            className="flex h-[46px] w-[46px] flex-shrink-0 items-center justify-center rounded-xl bg-[#3B1892] text-white transition-all hover:bg-[#2A1069] disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Send message"
          >
            <SendIcon className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({
  onPick,
  disabled,
}: {
  onPick: (text: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-2 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-100 to-violet-50 text-[#3B1892]">
        <RouteIcon className="h-8 w-8" />
      </div>
      <p className="text-[16px] font-semibold text-slate-800">
        Where do you want to go?
      </p>
      <p className="mx-auto mt-1.5 max-w-[340px] text-[13px] leading-relaxed text-slate-500">
        Pick a goal to get started, or describe your own below. I&apos;ll build
        an ordered roadmap with concrete skills for each milestone.
      </p>

      <div className="mt-6 grid w-full max-w-md grid-cols-1 gap-2.5 sm:grid-cols-2">
        {GOAL_IDEAS.map((g) => (
          <button
            key={g}
            type="button"
            disabled={disabled}
            onClick={() => onPick(g)}
            className="group flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-[13px] font-medium text-slate-600 transition-all hover:border-[#3B1892]/40 hover:bg-violet-50/40 hover:text-[#3B1892] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RouteIcon className="h-4 w-4 flex-shrink-0 text-slate-300 transition-colors group-hover:text-[#3B1892]" />
            {g}
          </button>
        ))}
      </div>
    </div>
  );
}
