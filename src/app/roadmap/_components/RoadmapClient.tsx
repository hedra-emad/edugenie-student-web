"use client";
// _components/RoadmapClient.tsx
// Tier-3 global advisor — builds a personalized, milestone-based learning
// roadmap. The student answers a quick tap-to-pick intake (single- and
// multi-choice chips; typing only for the goal + optional notes), then one tap
// streams the roadmap. Follow-ups are typed in the chat that follows.

import { useEffect, useRef, useState } from "react";
import { useAiChat } from "@/lib/ai/useAiChat";
import {
  MessageBubble,
  StateNotice,
  SendIcon,
  RefreshIcon,
  RouteIcon,
} from "@/components/ai/chatUi";

// Goal: pick a chip or type your own (the only required free-text).
const GOAL_IDEAS = [
  "Become a full-stack web developer",
  "Break into data science",
  "Land a UI/UX design role",
  "Prepare for a backend engineering job",
];

// Single-choice questions — one tap each, no typing.
const LEVELS = ["Complete beginner", "Some basics", "Intermediate", "Advanced"];
const TIMES = [
  "Under 5 hrs/week",
  "5–10 hrs/week",
  "10–20 hrs/week",
  "20+ hrs/week",
];
const TIMELINES = ["1 month", "3 months", "6 months", "1 year", "Flexible"];

// Multi-choice — pick any that apply (optional).
const PREFS = [
  "Hands-on projects",
  "Strong fundamentals",
  "Fast results",
  "Certification",
  "Interview prep",
  "Build a portfolio",
];

export default function RoadmapClient({ firstName = "" }: { firstName?: string }) {
  // Wizard answers
  const [goal, setGoal] = useState("");
  const [level, setLevel] = useState("");
  const [time, setTime] = useState("");
  const [timeline, setTimeline] = useState("");
  const [prefs, setPrefs] = useState<string[]>([]);
  const [specifics, setSpecifics] = useState("");
  // Chat follow-up input (after the roadmap is built)
  const [input, setInput] = useState("");

  // No greeting — the wizard IS the intake, so the first message to the model is
  // always the student's (user-first), which Bedrock requires.
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

  // The wizard is showing until the student has sent the intake (a user turn).
  const started = messages.some((m) => m.role === "user");
  const ready = connection === "connected";
  const canBuild =
    ready &&
    !isStreaming &&
    goal.trim().length > 0 &&
    !!level &&
    !!time &&
    !!timeline;

  const togglePref = (p: string) =>
    setPrefs((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );

  const buildRoadmap = () => {
    if (!canBuild) return;
    const composed =
      `Build my personalized learning roadmap.\n` +
      `Goal: ${goal.trim()}.\n` +
      `Current level: ${level}.\n` +
      `Time available: ${time}.\n` +
      `Timeline: ${timeline}.` +
      (prefs.length ? `\nWhat matters to me: ${prefs.join(", ")}.` : "") +
      (specifics.trim() ? `\nSpecific notes: ${specifics.trim()}.` : "");
    send(composed);
  };

  const canSend = ready && !isStreaming && input.trim().length > 0;
  const handleFollowup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    send(input.trim());
    setInput("");
    inputRef.current?.focus();
  };

  const startOver = () => {
    reset();
    setGoal("");
    setLevel("");
    setTime("");
    setTimeline("");
    setPrefs([]);
    setSpecifics("");
    setInput("");
  };

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
            Answer a few quick taps{firstName ? `, ${firstName}` : ""}, and
            I&apos;ll map a step-by-step learning path — tailored to your level,
            time, and goal.
          </p>
        </div>
      </div>

      {/* Card */}
      <div className="flex h-[68vh] min-h-[460px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Connection strip */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-100 px-4 py-2.5">
          <p className="flex items-center gap-1.5 text-[11.5px] font-medium text-slate-400">
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${
                ready
                  ? "bg-green-500"
                  : connection === "connecting"
                    ? "animate-pulse bg-amber-400"
                    : "bg-slate-300"
              }`}
            />
            {ready
              ? started
                ? goal
                  ? `Goal: ${goal}`
                  : "Roadmap"
                : "Let's set up your roadmap"
              : connection === "connecting"
                ? "Connecting…"
                : "Offline"}
          </p>
          {started && (
            <button
              type="button"
              onClick={startOver}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11.5px] font-medium text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <RefreshIcon className="h-3.5 w-3.5" />
              New roadmap
            </button>
          )}
        </div>

        {/* Body: wizard until the intake is sent, then the chat transcript */}
        <div
          ref={scrollRef}
          className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6"
        >
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
          ) : !started ? (
            <IntakeWizard
              firstName={firstName}
              goal={goal}
              setGoal={setGoal}
              level={level}
              setLevel={setLevel}
              time={time}
              setTime={setTime}
              timeline={timeline}
              setTimeline={setTimeline}
              prefs={prefs}
              togglePref={togglePref}
              specifics={specifics}
              setSpecifics={setSpecifics}
              disabled={!ready || isStreaming}
            />
          ) : (
            messages.map((m) => <MessageBubble key={m.id} message={m} />)
          )}
        </div>

        {/* Footer: "Build my roadmap" during intake, chat composer afterwards */}
        {!started ? (
          <div className="flex-shrink-0 border-t border-slate-100 px-3 py-3 sm:px-4">
            <button
              type="button"
              onClick={buildRoadmap}
              disabled={!canBuild}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#3B1892] px-4 py-3 text-[14px] font-semibold text-white transition-all hover:bg-[#2A1069] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RouteIcon className="h-4 w-4" />
              Build my roadmap
            </button>
            {!canBuild && ready && (
              <p className="mt-2 text-center text-[11.5px] text-slate-400">
                Pick your goal, level, time, and timeline to continue.
              </p>
            )}
          </div>
        ) : (
          <form
            onSubmit={handleFollowup}
            className="flex flex-shrink-0 items-center gap-2 border-t border-slate-100 px-3 py-3 sm:px-4"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={!ready}
              placeholder={
                ready ? "Ask a follow-up about your roadmap…" : "Connecting…"
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
        )}
      </div>
    </div>
  );
}

// ── Intake wizard ────────────────────────────────────────────────────────────

function IntakeWizard({
  firstName,
  goal,
  setGoal,
  level,
  setLevel,
  time,
  setTime,
  timeline,
  setTimeline,
  prefs,
  togglePref,
  specifics,
  setSpecifics,
  disabled,
}: {
  firstName: string;
  goal: string;
  setGoal: (v: string) => void;
  level: string;
  setLevel: (v: string) => void;
  time: string;
  setTime: (v: string) => void;
  timeline: string;
  setTimeline: (v: string) => void;
  prefs: string[];
  togglePref: (v: string) => void;
  specifics: string;
  setSpecifics: (v: string) => void;
  disabled: boolean;
}) {
  // A chip's "selected" state for goal is true only when it exactly matches a
  // preset (typing a custom goal deselects all preset chips).
  return (
    <div className="space-y-6">
      <p className="text-[13.5px] leading-relaxed text-slate-600">
        Hi{firstName ? ` ${firstName}` : ""}! 👋 I&apos;m your AI learning coach.
        Tap to answer — it takes about 20 seconds.
      </p>

      {/* Goal — chips + custom text (required) */}
      <Field label="What's your goal?" required>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {GOAL_IDEAS.map((g) => (
            <Chip
              key={g}
              label={g}
              selected={goal === g}
              disabled={disabled}
              onClick={() => setGoal(g)}
              icon
            />
          ))}
        </div>
        <input
          type="text"
          value={GOAL_IDEAS.includes(goal) ? "" : goal}
          onChange={(e) => setGoal(e.target.value)}
          disabled={disabled}
          placeholder="…or type your own goal"
          className="mt-2.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-[13.5px] text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-[#3B1892] focus:ring-1 focus:ring-[#3B1892] disabled:opacity-60"
        />
      </Field>

      {/* Level (required, single) */}
      <Field label="Your current level" required>
        <ChipRow
          options={LEVELS}
          value={level}
          onSelect={setLevel}
          disabled={disabled}
        />
      </Field>

      {/* Time (required, single) */}
      <Field label="Time you can commit" required>
        <ChipRow
          options={TIMES}
          value={time}
          onSelect={setTime}
          disabled={disabled}
        />
      </Field>

      {/* Timeline (required, single) */}
      <Field label="Your timeline" required>
        <ChipRow
          options={TIMELINES}
          value={timeline}
          onSelect={setTimeline}
          disabled={disabled}
        />
      </Field>

      {/* Preferences (optional, multi) */}
      <Field label="What matters most?" hint="Optional · pick any">
        <div className="flex flex-wrap gap-2">
          {PREFS.map((p) => (
            <Chip
              key={p}
              label={p}
              selected={prefs.includes(p)}
              disabled={disabled}
              onClick={() => togglePref(p)}
            />
          ))}
        </div>
      </Field>

      {/* Specifics (optional, free text) */}
      <Field label="Anything specific?" hint="Optional">
        <input
          type="text"
          value={specifics}
          onChange={(e) => setSpecifics(e.target.value)}
          disabled={disabled}
          placeholder="e.g. focus on React, prep for a June interview…"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-[13.5px] text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-[#3B1892] focus:ring-1 focus:ring-[#3B1892] disabled:opacity-60"
        />
      </Field>
    </div>
  );
}

// ── Small building blocks ────────────────────────────────────────────────────

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline gap-2">
        <p className="text-[12.5px] font-semibold text-slate-700">
          {label}
          {required && <span className="ml-0.5 text-[#3B1892]">*</span>}
        </p>
        {hint && <span className="text-[11px] text-slate-400">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function ChipRow({
  options,
  value,
  onSelect,
  disabled,
}: {
  options: string[];
  value: string;
  onSelect: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <Chip
          key={o}
          label={o}
          selected={value === o}
          disabled={disabled}
          onClick={() => onSelect(o)}
        />
      ))}
    </div>
  );
}

function Chip({
  label,
  selected,
  disabled,
  onClick,
  icon,
}: {
  label: string;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
  icon?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={selected}
      className={`group flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-left text-[13px] font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
        selected
          ? "border-[#3B1892] bg-[#3B1892] text-white shadow-sm"
          : "border-slate-200 bg-white text-slate-600 hover:border-[#3B1892]/40 hover:bg-violet-50/40 hover:text-[#3B1892]"
      }`}
    >
      {icon && (
        <RouteIcon
          className={`h-4 w-4 flex-shrink-0 ${
            selected
              ? "text-white"
              : "text-slate-300 transition-colors group-hover:text-[#3B1892]"
          }`}
        />
      )}
      {label}
    </button>
  );
}
