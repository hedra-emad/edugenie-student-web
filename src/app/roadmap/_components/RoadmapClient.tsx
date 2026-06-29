"use client";
// _components/RoadmapClient.tsx
// Tier-3 advisor — a quick tap-to-pick intake, then one tap builds a STRUCTURED,
// buyable learning path: ordered milestones recommending real courses (or
// specific sections), with prices and an "Add all to cart" CTA. Builds are
// capped (3 lifetime per user).

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RouteIcon } from "@/components/ai/chatUi";
import {
  buildRoadmap,
  getRoadmapQuota,
  type Roadmap,
} from "@/lib/api/roadmap";
import { addToCartAction } from "@/app/actions/cart.actions";

const GOAL_IDEAS = [
  "Become a full-stack web developer",
  "Break into data science",
  "Land a UI/UX design role",
  "Prepare for a backend engineering job",
];
const LEVELS = ["Complete beginner", "Some basics", "Intermediate", "Advanced"];
const TIMES = ["Under 5 hrs/week", "5–10 hrs/week", "10–20 hrs/week", "20+ hrs/week"];
const TIMELINES = ["1 month", "3 months", "6 months", "1 year", "Flexible"];
const PREFS = [
  "Hands-on projects",
  "Strong fundamentals",
  "Fast results",
  "Certification",
  "Interview prep",
  "Build a portfolio",
];

type Phase = "intake" | "building" | "result" | "error";

export default function RoadmapClient({ firstName = "" }: { firstName?: string }) {
  const router = useRouter();

  const [goal, setGoal] = useState("");
  const [level, setLevel] = useState("");
  const [time, setTime] = useState("");
  const [timeline, setTimeline] = useState("");
  const [prefs, setPrefs] = useState<string[]>([]);
  const [specifics, setSpecifics] = useState("");

  const [phase, setPhase] = useState<Phase>("intake");
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  useEffect(() => {
    getRoadmapQuota()
      .then(setRemaining)
      .catch(() => setRemaining(0));
  }, []);

  const left = remaining ?? 0;
  const canBuild =
    phase !== "building" &&
    left > 0 &&
    goal.trim().length > 0 &&
    !!level &&
    !!time &&
    !!timeline;

  const togglePref = (p: string) =>
    setPrefs((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );

  const build = async () => {
    if (!canBuild) return;
    setPhase("building");
    setError("");
    try {
      const r = await buildRoadmap({
        goal: goal.trim(),
        level,
        time,
        timeline,
        focus: prefs,
        notes: specifics.trim() || undefined,
      });
      setRoadmap(r);
      if (typeof r.generationsRemaining === "number") {
        setRemaining(r.generationsRemaining);
      }
      setPhase("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't build your roadmap.");
      setPhase("error");
      getRoadmapQuota()
        .then(setRemaining)
        .catch(() => {});
    }
  };

  const addAllToCart = async () => {
    if (!roadmap || !roadmap.items.length || adding) return;
    setAdding(true);
    setAddError("");
    const payloads = roadmap.items.map((i) =>
      i.type === "section"
        ? { courseId: i.courseId, sectionId: i.sectionId as string, type: "section" as const }
        : { courseId: i.courseId, type: "full_course" as const },
    );
    const res = await addToCartAction(payloads);
    if (res.success) {
      router.push("/cart");
    } else {
      setAddError(res.error ?? "Could not add items to cart");
      setAdding(false);
    }
  };

  const buildAnother = () => {
    setRoadmap(null);
    setPhase("intake");
    setAddError("");
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-10">
      {/* Hero */}
      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#3B1892] to-[#5B3DB8] text-white shadow-md">
          <RouteIcon className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h1 className="text-[22px] font-bold tracking-tight text-slate-900">
            Career Roadmap Advisor
          </h1>
          <p className="mt-1 max-w-xl text-[13.5px] leading-relaxed text-slate-500">
            Answer a few taps{firstName ? `, ${firstName}` : ""} and I&apos;ll
            build a step-by-step path of real courses — buy the whole plan in one
            click.
          </p>
        </div>
        {remaining !== null && (
          <span className="flex-shrink-0 rounded-full bg-violet-50 px-3 py-1 text-[11.5px] font-semibold text-[#3B1892]">
            {left} of 3 builds left
          </span>
        )}
      </div>

      {/* Card */}
      <div className="flex min-h-[460px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          {phase === "building" ? (
            <Centered>
              <span className="inline-block h-9 w-9 animate-spin rounded-full border-[3px] border-slate-200 border-t-[#3B1892]" />
              <p className="mt-4 text-[14px] font-semibold text-slate-700">
                Designing your roadmap…
              </p>
              <p className="mt-1 text-[12.5px] text-slate-400">
                Matching your goal to real courses and sections.
              </p>
            </Centered>
          ) : phase === "error" ? (
            <Centered>
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <path d="M12 9v4M12 17h.01" />
                </svg>
              </div>
              <p className="text-[13.5px] font-medium text-slate-600">{error}</p>
              <button
                type="button"
                onClick={() => setPhase("intake")}
                className="mt-4 rounded-xl bg-[#3B1892] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#2A1069]"
              >
                Back
              </button>
            </Centered>
          ) : phase === "result" && roadmap ? (
            <RoadmapResult roadmap={roadmap} />
          ) : (
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
              disabled={left <= 0}
            />
          )}
        </div>

        {/* Footer */}
        {phase === "result" && roadmap ? (
          <div className="flex-shrink-0 border-t border-slate-100 px-4 py-3 sm:px-4">
            {addError && (
              <p className="mb-2 text-center text-[12px] text-red-500">{addError}</p>
            )}
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <p className="text-[11px] text-slate-400">Plan total</p>
                <p className="text-[20px] font-extrabold leading-none text-slate-900">
                  ${roadmap.totalPrice}
                </p>
              </div>
              <button
                type="button"
                onClick={addAllToCart}
                disabled={adding || roadmap.items.length === 0}
                className="flex-1 rounded-xl bg-[#3B1892] py-3 text-[14px] font-bold text-white transition-all hover:bg-[#2A1069] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {adding
                  ? "Adding…"
                  : `Add all ${roadmap.items.length} to cart`}
              </button>
            </div>
            <button
              type="button"
              onClick={buildAnother}
              disabled={left <= 0}
              className="mt-2 w-full rounded-xl border border-slate-200 py-2.5 text-[12.5px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              {left > 0 ? `Build another (${left} left)` : "No builds left"}
            </button>
          </div>
        ) : phase === "intake" ? (
          <div className="flex-shrink-0 border-t border-slate-100 px-4 py-3 sm:px-4">
            <button
              type="button"
              onClick={build}
              disabled={!canBuild}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#3B1892] px-4 py-3 text-[14px] font-semibold text-white transition-all hover:bg-[#2A1069] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RouteIcon className="h-4 w-4" />
              Build my roadmap
            </button>
            <p className="mt-2 text-center text-[11.5px] text-slate-400">
              {left <= 0
                ? "You've used all 3 roadmap builds."
                : "Pick your goal, level, time, and timeline to continue."}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ── Result: milestone cards ──────────────────────────────────────────────────

function RoadmapResult({ roadmap }: { roadmap: Roadmap }) {
  return (
    <div className="space-y-5">
      {roadmap.summary && (
        <p className="text-[14px] leading-relaxed text-slate-700">
          {roadmap.summary}
        </p>
      )}

      <div className="space-y-4">
        {roadmap.milestones.map((m, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-2xl border border-slate-200"
          >
            <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#3B1892] text-[11px] font-bold text-white">
                  {i + 1}
                </span>
                <p className="text-[13.5px] font-bold text-slate-800">
                  {m.title}
                </p>
              </div>
              {m.focus && (
                <p className="mt-1 text-[12px] leading-relaxed text-slate-500">
                  {m.focus}
                </p>
              )}
            </div>

            <div className="divide-y divide-slate-100">
              {m.items.map((it, j) => (
                <div key={j} className="flex items-start gap-3 px-4 py-3">
                  <span
                    className={`mt-0.5 flex-shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                      it.type === "section"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-violet-100 text-[#3B1892]"
                    }`}
                  >
                    {it.type === "section" ? "Section" : "Course"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/courses/${it.courseId}`}
                      className="text-[13px] font-semibold text-slate-800 transition-colors hover:text-[#3B1892]"
                    >
                      {it.title}
                    </Link>
                    {it.type === "section" && (
                      <p className="text-[11px] text-slate-400">
                        from {it.courseTitle}
                      </p>
                    )}
                    {it.reason && (
                      <p className="mt-0.5 text-[12px] leading-relaxed text-slate-500">
                        {it.reason}
                      </p>
                    )}
                  </div>
                  <span className="flex-shrink-0 text-[13px] font-bold text-slate-700">
                    ${it.price}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
      {children}
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
  return (
    <div className="space-y-6">
      <p className="text-[13.5px] leading-relaxed text-slate-600">
        Hi{firstName ? ` ${firstName}` : ""}! 👋 Tap to answer — it takes about 20
        seconds, then I&apos;ll build your buyable plan.
      </p>

      <Field label="What's your goal?" required>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {GOAL_IDEAS.map((g) => (
            <Chip key={g} label={g} selected={goal === g} disabled={disabled} onClick={() => setGoal(g)} icon />
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

      <Field label="Your current level" required>
        <ChipRow options={LEVELS} value={level} onSelect={setLevel} disabled={disabled} />
      </Field>

      <Field label="Time you can commit" required>
        <ChipRow options={TIMES} value={time} onSelect={setTime} disabled={disabled} />
      </Field>

      <Field label="Your timeline" required>
        <ChipRow options={TIMELINES} value={timeline} onSelect={setTimeline} disabled={disabled} />
      </Field>

      <Field label="What matters most?" hint="Optional · pick any">
        <div className="flex flex-wrap gap-2">
          {PREFS.map((p) => (
            <Chip key={p} label={p} selected={prefs.includes(p)} disabled={disabled} onClick={() => togglePref(p)} />
          ))}
        </div>
      </Field>

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
        <Chip key={o} label={o} selected={value === o} disabled={disabled} onClick={() => onSelect(o)} />
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
            selected ? "text-white" : "text-slate-300 transition-colors group-hover:text-[#3B1892]"
          }`}
        />
      )}
      {label}
    </button>
  );
}
