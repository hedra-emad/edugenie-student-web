import { ClipboardCheck, Bot, Target, Award, Rocket, LucideIcon } from "lucide-react";

const DISPLAY = { fontFamily: "var(--font-hanken-grotesk)" } as const;

interface Step {
  n: string;
  icon: LucideIcon;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    n: "01",
    icon: ClipboardCheck,
    title: "Assess",
    body: "A quick placement test pinpoints what to skip and what to learn — so you never pay to watch what you already know.",
  },
  {
    n: "02",
    icon: Bot,
    title: "Learn",
    body: "Expert lessons with a three-tier AI tutor that answers questions about the exact thing on your screen, lesson to roadmap.",
  },
  {
    n: "03",
    icon: Target,
    title: "Master",
    body: "Prove it. Mastery-gated quizzes unlock the next step only once you truly understand — zero passive watching.",
  },
  {
    n: "04",
    icon: Award,
    title: "Certify",
    body: "Earn a verified certificate with your name, the course, and your final exam score — real proof for employers.",
  },
  {
    n: "05",
    icon: Rocket,
    title: "Advance",
    body: "Follow an AI roadmap that sequences courses from your current skills to the role you're aiming for.",
  },
];

export default function MasteryPath() {
  return (
    <section className="bg-white py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1200px] mx-auto">
        {/* header */}
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-secondary" />
            <span className="text-xs font-bold tracking-[0.2em] text-primary uppercase">
              How EduGenie works
            </span>
          </div>
          <h2
            style={DISPLAY}
            className="text-[1.9rem] sm:text-[2.5rem] font-extrabold tracking-tight text-slate-900 leading-[1.1]"
          >
            One path, from{" "}
            <span className="text-slate-400">where you are</span> to{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              hired
            </span>
            .
          </h2>
          <p className="mt-4 text-[15px] sm:text-base text-slate-500 leading-relaxed">
            Most platforms hand you videos and wish you luck. EduGenie walks you
            through five checkpoints — and won&apos;t let you move on until each
            one sticks.
          </p>
        </div>

        {/* ── the track ── */}
        <ol className="relative mt-14 grid gap-8 md:grid-cols-5 md:gap-4">
          {/* desktop connecting line, behind the number badges */}
          <span
            aria-hidden
            className="hidden md:block absolute top-6 left-[10%] right-[10%] h-[3px] rounded-full bg-gradient-to-r from-primary via-secondary to-primary/30"
          />
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const isLast = i === STEPS.length - 1;
            return (
              <li key={step.n} className="relative flex md:flex-col gap-4 md:gap-0">
                {/* mobile vertical spine */}
                {!isLast && (
                  <span
                    aria-hidden
                    className="md:hidden absolute left-6 top-12 bottom-[-2rem] w-[3px] rounded-full bg-gradient-to-b from-secondary to-primary/20"
                  />
                )}

                {/* number node */}
                <div className="relative z-10 shrink-0">
                  <div
                    style={DISPLAY}
                    className="grid place-items-center w-12 h-12 rounded-2xl bg-white text-primary font-extrabold text-lg ring-2 ring-primary/15 shadow-[0_8px_24px_-8px_rgba(59,24,146,0.5)]"
                  >
                    {step.n}
                  </div>
                </div>

                {/* card */}
                <div className="md:mt-6 group flex-1">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/[0.06] text-primary mb-3 transition-colors group-hover:bg-primary group-hover:text-white">
                    <Icon className="w-5 h-5" aria-hidden />
                  </div>
                  <h3
                    style={DISPLAY}
                    className="text-lg font-extrabold text-slate-900"
                  >
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-slate-500">
                    {step.body}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
