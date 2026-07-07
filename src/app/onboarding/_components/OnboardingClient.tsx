"use client";
// Mandatory one-time onboarding wizard. Collects a rich learner profile across
// short, grouped steps, submits it (stored on the user + distilled into a
// natural-language profile for the AI), then triggers the FREE first roadmap
// and lands the student on /roadmap. Steps are data-driven (see STEPS) so a
// step can be added/removed by editing the array + its case in renderStep().

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import Button from "@/components/ui/Button";
import {
  submitOnboarding,
  retryOnboardingRoadmap,
  getOnboardingStatus,
} from "@/lib/api/onboarding";
import { Field, ChipRow, TagInput } from "./fields";

// ── Option sets (edit freely; labels are what get stored/sent) ────────────────
const SPECIALIZATIONS = [
  "Web Development",
  "Data Science",
  "Mobile Development",
  "AI / Machine Learning",
  "DevOps & Cloud",
  "UI/UX Design",
  "Cybersecurity",
];
const LEVELS = [
  { value: "beginner", label: "Beginner", description: "New to this field" },
  { value: "intermediate", label: "Intermediate", description: "Know the basics" },
  { value: "advanced", label: "Advanced", description: "Experienced, filling gaps" },
];
const HOURS = [
  { value: "1-3 hours", label: "1–3 hours" },
  { value: "4-6 hours", label: "4–6 hours" },
  { value: "7-10 hours", label: "7–10 hours" },
  { value: "10+ hours", label: "10+ hours" },
];
const PACES = [
  { value: "relaxed (6+ months)", label: "Relaxed", description: "6+ months" },
  { value: "steady (3-6 months)", label: "Steady", description: "3–6 months" },
  { value: "intensive (1-3 months)", label: "Intensive", description: "1–3 months" },
];
const STYLES = [
  { value: "theory-first", label: "Theory first", description: "Understand, then build" },
  { value: "hands-on-first", label: "Hands-on first", description: "Build, then dig in" },
];
const GOALS = [
  "Get a job",
  "Build a project",
  "Pass an interview",
  "Upskill at my current job",
];
// Register-style quick-pick chips for the profile fields (tap to add, or type
// your own). These become the user's interests / skills on their profile.
const INTEREST_SUGGESTIONS = [
  "Web Development",
  "AI & ML",
  "Data Science",
  "Mobile",
  "UI/UX Design",
  "DevOps & Cloud",
  "Cybersecurity",
  "Business",
];
const SKILL_SUGGESTIONS = [
  "HTML",
  "CSS",
  "JavaScript",
  "Python",
  "React",
  "Node.js",
  "SQL",
  "Git",
];

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[14px] text-slate-800 " +
  "outline-none transition-colors placeholder:text-slate-400 focus:border-[#3B1892]";

// Short labels for the branded step rail (keyed by step id).
const STEP_LABELS: Record<string, string> = {
  focus: "Focus area",
  time: "Time & pace",
  background: "Your background",
  tune: "Skills & interests",
};

type Phase = "intake" | "building" | "error";

export default function OnboardingClient() {
  const router = useRouter();
  const qc = useQueryClient();

  // Answers
  const [specialization, setSpecialization] = useState("");
  const [currentLevel, setCurrentLevel] = useState("");
  const [hoursPerWeek, setHoursPerWeek] = useState("");
  const [pace, setPace] = useState("");
  const [learningStyle, setLearningStyle] = useState("");
  const [endGoal, setEndGoal] = useState("");
  const [priorExperience, setPriorExperience] = useState("");
  const [focusTopics, setFocusTopics] = useState<string[]>([]);
  const [knownTopics, setKnownTopics] = useState<string[]>([]);
  const [extraNotes, setExtraNotes] = useState("");

  const [stepIdx, setStepIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("intake");
  const [errorMsg, setErrorMsg] = useState("");

  // Don't show the wizard to someone who's already onboarded (e.g. they typed
  // /onboarding directly, or re-verified their email) — send them home.
  useEffect(() => {
    getOnboardingStatus()
      .then((status) => {
        if (status?.hasOnboarded) router.replace("/");
      })
      .catch(() => {});
  }, [router]);

  const steps = useMemo(
    () => [
      {
        id: "focus",
        title: "What do you want to learn?",
        subtitle: "We'll tailor your path to this.",
        valid: specialization.trim().length > 0 && currentLevel.length > 0,
      },
      {
        id: "time",
        title: "How will you learn?",
        subtitle: "This sets your roadmap's pace.",
        valid: hoursPerWeek.length > 0 && pace.length > 0,
      },
      {
        id: "background",
        title: "Where are you starting from?",
        subtitle: "The more context, the better the plan.",
        valid: endGoal.trim().length > 0 && priorExperience.trim().length > 0,
      },
      {
        id: "tune",
        title: "Your skills & interests",
        subtitle: "These show on your profile and sharpen your roadmap.",
        valid: focusTopics.length > 0,
      },
    ],
    [
      specialization,
      currentLevel,
      hoursPerWeek,
      pace,
      endGoal,
      priorExperience,
      focusTopics,
    ],
  );

  const step = steps[stepIdx];
  const isLast = stepIdx === steps.length - 1;
  const progress = ((stepIdx + 1) / steps.length) * 100;

  const next = () => {
    if (!step.valid) return;
    if (isLast) void submit();
    else setStepIdx((i) => i + 1);
  };
  const back = () => setStepIdx((i) => Math.max(0, i - 1));

  async function submit() {
    setPhase("building");
    setErrorMsg("");
    try {
      const res = await submitOnboarding({
        specialization: specialization.trim(),
        currentLevel,
        hoursPerWeek,
        pace,
        priorExperience: priorExperience.trim(),
        endGoal: endGoal.trim(),
        learningStyle: learningStyle || undefined,
        knownTopics,
        focusTopics,
        extraNotes: extraNotes.trim() || undefined,
      });
      // Onboarding flag flipped server-side — refresh the gate's status.
      qc.invalidateQueries({ queryKey: ["onboarding-status"] });
      if (res.roadmap) {
        router.push("/roadmap");
        return;
      }
      // Answers saved, but roadmap generation failed — offer a (still free) retry.
      setErrorMsg(
        res.roadmapError ||
          "We saved your answers but couldn't build your roadmap just now.",
      );
      setPhase("error");
    } catch (e) {
      // Submit itself failed — keep every answer, let the student retry.
      setErrorMsg((e as Error).message);
      setPhase("intake");
    }
  }

  async function retry() {
    setPhase("building");
    setErrorMsg("");
    try {
      await retryOnboardingRoadmap();
      qc.invalidateQueries({ queryKey: ["onboarding-status"] });
      router.push("/roadmap");
    } catch (e) {
      setErrorMsg((e as Error).message);
      setPhase("error");
    }
  }

  // ── Building / error takeover screens ──────────────────────────────────────
  if (phase === "building") {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
          <span className="mb-5 inline-block h-10 w-10 animate-spin rounded-full border-[3px] border-slate-200 border-t-[#3B1892]" />
          <h2 className="text-[19px] font-extrabold text-slate-900">
            Building your personalized roadmap…
          </h2>
          <p className="mt-1.5 max-w-sm text-[13.5px] text-slate-500">
            Our AI is matching courses to your goals. This takes a few seconds.
          </p>
        </div>
      </Shell>
    );
  }

  if (phase === "error") {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
            </svg>
          </div>
          <h2 className="text-[19px] font-extrabold text-slate-900">
            Almost there
          </h2>
          <p className="mt-1.5 max-w-sm text-[13.5px] text-slate-500">
            {errorMsg} Your answers are saved — you can try again.
          </p>
          <div className="mt-6 flex flex-col items-center gap-2.5">
            <Button variant="primary" size="lg" onClick={retry}>
              Retry building my roadmap
            </Button>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="text-[13px] font-semibold text-slate-500 hover:text-slate-700"
            >
              Continue to homepage for now
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  // ── Intake wizard ──────────────────────────────────────────────────────────
  return (
    <Shell
      steps={steps.map((s) => ({ id: s.id, label: STEP_LABELS[s.id] ?? s.id }))}
      activeStep={stepIdx}
    >
      {/* Progress (mobile / small screens — desktop uses the brand rail) */}
      <div className="border-b border-slate-100 px-6 pb-4 pt-6 sm:px-8 lg:hidden">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[12px] font-bold uppercase tracking-wide text-[#3B1892]">
            Step {stepIdx + 1} of {steps.length}
          </p>
          <p className="text-[12px] font-medium text-slate-400">
            {Math.round(progress)}%
          </p>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={stepIdx + 1} aria-valuemin={1} aria-valuemax={steps.length}>
          <div
            className="h-full rounded-full bg-[#3B1892] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Body — scrolls internally so the footer stays pinned & visible */}
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8">
        <h1 className="text-[22px] font-extrabold text-slate-900">{step.title}</h1>
        <p className="mb-6 mt-1 text-[13.5px] text-slate-500">{step.subtitle}</p>

        {renderStep()}

        {errorMsg && (
          <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-[13px] font-medium text-red-600">
            {errorMsg}
          </p>
        )}
      </div>

      {/* Footer nav (pinned) */}
      <div className="flex flex-shrink-0 items-center justify-between gap-3 border-t border-slate-100 bg-white px-6 py-4 sm:px-8">
        <Button
          variant="ghost"
          size="md"
          onClick={back}
          disabled={stepIdx === 0}
        >
          Back
        </Button>
        <div className="flex items-center gap-3">
          {!step.valid && (
            <span className="hidden text-[12px] text-slate-400 sm:inline">
              Complete required fields
            </span>
          )}
          <Button
            variant="primary"
            size="md"
            onClick={next}
            disabled={!step.valid}
          >
            {isLast ? "Build my roadmap" : "Continue"}
          </Button>
        </div>
      </div>
    </Shell>
  );

  function renderStep() {
    switch (step.id) {
      case "focus":
        return (
          <>
            <Field label="Specialization / track" required htmlFor="ob-spec" hint="Type your own or pick a suggestion.">
              <input
                id="ob-spec"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                placeholder="e.g. Web Development"
                className={inputCls}
              />
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {SPECIALIZATIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSpecialization(s)}
                    aria-pressed={specialization === s}
                    className={`rounded-full border px-3 py-1 text-[12.5px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B1892] ${
                      specialization === s
                        ? "border-[#3B1892] bg-violet-50 text-[#3B1892]"
                        : "border-slate-200 bg-white text-slate-500 hover:border-[#3B1892]/50"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Current level" required hint="Where should your roadmap start?">
              <ChipRow options={LEVELS} value={currentLevel} onSelect={setCurrentLevel} />
            </Field>
          </>
        );

      case "time":
        return (
          <>
            <Field label="Time available per week" required>
              <ChipRow options={HOURS} value={hoursPerWeek} onSelect={setHoursPerWeek} />
            </Field>
            <Field label="Desired pace" required hint="How fast do you want to finish?">
              <ChipRow options={PACES} value={pace} onSelect={setPace} />
            </Field>
            <Field label="Preferred learning style" hint="Optional — influences section ordering.">
              <ChipRow options={STYLES} value={learningStyle} onSelect={(v) => setLearningStyle(learningStyle === v ? "" : v)} />
            </Field>
          </>
        );

      case "background":
        return (
          <>
            <Field label="What's your main goal?" required hint="Lets us prioritize practical vs theoretical work.">
              <div className="mb-2.5 flex flex-wrap gap-2">
                {GOALS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setEndGoal(g)}
                    aria-pressed={endGoal === g}
                    className={`rounded-xl border px-3.5 py-2 text-[13px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B1892] ${
                      endGoal === g
                        ? "border-[#3B1892] bg-[#3B1892] text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-[#3B1892]/50"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
              <input
                aria-label="Or describe your own goal"
                value={GOALS.includes(endGoal) ? "" : endGoal}
                onChange={(e) => setEndGoal(e.target.value)}
                placeholder="Or describe your own goal…"
                className={inputCls}
              />
            </Field>
            <Field
              label="Prior experience"
              required
              htmlFor="ob-exp"
              hint="What have you done in this field before? (Write 'nothing yet' if new.)"
            >
              <textarea
                id="ob-exp"
                value={priorExperience}
                onChange={(e) => setPriorExperience(e.target.value)}
                rows={4}
                placeholder="e.g. Built a few HTML/CSS pages and finished an intro JS course…"
                className={`${inputCls} resize-none`}
              />
            </Field>
          </>
        );

      case "tune":
        return (
          <>
            <Field
              label="Your interests"
              required
              htmlFor="ob-focus"
              hint="Tap what interests you (or type your own). Shown on your profile; we'll prioritize these."
            >
              <TagInput
                id="ob-focus"
                values={focusTopics}
                onChange={setFocusTopics}
                placeholder="Add an interest — press Enter"
                suggestions={INTEREST_SUGGESTIONS}
              />
            </Field>
            <Field
              label="Your skills"
              htmlFor="ob-known"
              hint="Tap what you already know (or type your own). Shown on your profile; we'll skip these in your roadmap."
            >
              <TagInput
                id="ob-known"
                values={knownTopics}
                onChange={setKnownTopics}
                placeholder="Add a skill — press Enter"
                suggestions={SKILL_SUGGESTIONS}
              />
            </Field>
            <Field label="Anything else about your goal or situation?" htmlFor="ob-notes">
              <textarea
                id="ob-notes"
                value={extraNotes}
                onChange={(e) => setExtraNotes(e.target.value)}
                rows={3}
                placeholder="Optional — anything the questions above missed."
                className={`${inputCls} resize-none`}
              />
            </Field>
          </>
        );

      default:
        return null;
    }
  }
}

function Shell({
  children,
  steps,
  activeStep,
}: {
  children: React.ReactNode;
  steps?: { id: string; label: string }[];
  activeStep?: number;
}) {
  return (
    <div className="relative flex min-h-screen flex-col justify-center bg-gradient-to-br from-[#eef2f6] to-blue-50/50 px-4 py-6 sm:py-10">
      {/* Decorative brand blurs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-32 h-80 w-80 rounded-full bg-[#3B1892]/10 blur-[90px]" />
        <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-[#00B0FF]/10 blur-[80px]" />
      </div>

      {/* Mobile logo (brand panel is desktop-only) */}
      <div className="relative z-10 mb-5 flex justify-center lg:hidden">
        <img
          src="/logo.jpg"
          alt="EduGenie"
          className="h-10 w-auto object-contain"
          onError={(e) => {
            e.currentTarget.src = "/logo.jpg";
          }}
        />
      </div>

      <div className="relative z-10 mx-auto grid max-h-[calc(100dvh-3rem)] w-full max-w-[980px] overflow-hidden rounded-3xl border border-white/60 bg-white shadow-[0_20px_60px_-15px_rgba(59,24,146,0.25)] lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        {/* Branded panel (desktop) */}
        <aside className="relative hidden overflow-hidden bg-gradient-to-br from-[#2A1069] via-[#3B1892] to-[#20104f] p-8 text-white lg:flex lg:flex-col">
          <div className="pointer-events-none absolute -top-10 left-1/2 h-40 w-72 -translate-x-1/2 rounded-full bg-[#00B0FF]/25 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-32 w-3/4 rounded-full bg-[#3B1892]/40 blur-2xl" />
          <img
            src="/icoon.png"
            alt="EduGenie"
            className="relative z-10 h-11 w-auto self-start object-contain drop-shadow"
            onError={(e) => {
              e.currentTarget.src = "/logo.jpg";
            }}
          />
          <div className="relative z-10 mt-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7fd8ff]">
              Intelligent Learning Ecosystem
            </p>
            <h2 className="mt-3 text-[26px] font-extrabold leading-tight">
              Let&apos;s build your learning path
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-blue-100/70">
              A few quick questions and our AI maps real courses to your goals —
              free, just this once.
            </p>
          </div>

          {steps && typeof activeStep === "number" && (
            <ol className="relative z-10 mt-8 space-y-3">
              {steps.map((s, i) => {
                const done = i < activeStep;
                const cur = i === activeStep;
                return (
                  <li key={s.id} className="flex items-center gap-3">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                        done
                          ? "bg-[#00B0FF] text-[#08213a]"
                          : cur
                            ? "bg-white text-[#3B1892]"
                            : "bg-white/15 text-white/60"
                      }`}
                    >
                      {done ? "✓" : i + 1}
                    </span>
                    <span
                      className={`text-[13px] ${
                        cur
                          ? "font-bold text-white"
                          : done
                            ? "text-white/80"
                            : "text-white/50"
                      }`}
                    >
                      {s.label}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}

          <p className="relative z-10 mt-auto pt-8 text-[10px] font-bold uppercase tracking-widest text-white/30">
            Empowering your learning journey
          </p>
        </aside>

        {/* Wizard (min-h-0 so the body can scroll within the capped card) */}
        <section className="flex min-h-0 flex-col">{children}</section>
      </div>
    </div>
  );
}
