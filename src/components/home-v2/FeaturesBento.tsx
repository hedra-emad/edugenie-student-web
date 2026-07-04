import { Target, Award, Map, UserCheck, Globe } from "lucide-react";

const DISPLAY = { fontFamily: "var(--font-hanken-grotesk)" } as const;

const CELLS = [
  {
    icon: Target,
    title: "Mastery-based, not watch-based",
    body: "Assessment gates and progress resets keep every concept solid before you move on.",
  },
  {
    icon: Award,
    title: "Verified certificates",
    body: "Auto-generated with your name, course, and final exam score — proof for employers.",
  },
  {
    icon: Map,
    title: "Personalized roadmaps",
    body: "Tell the AI your goal; get a step-by-step path from your skills to your dream role.",
  },
  {
    icon: UserCheck,
    title: "Vetted instructors",
    body: "Every instructor passes a strict review. Ratings come from real student feedback.",
  },
  {
    icon: Globe,
    title: "Learn anywhere",
    body: "Mobile-first and cloud-powered. Your progress, tutor, and certificates follow you.",
  },
];

export default function FeaturesBento() {
  return (
    <section className="bg-[#F4F7F9] py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-secondary" />
          <span className="text-xs font-bold tracking-[0.2em] text-primary uppercase">
            Why EduGenie
          </span>
        </div>
        <h2
          style={DISPLAY}
          className="text-[1.9rem] sm:text-[2.5rem] font-extrabold tracking-tight text-slate-900 leading-[1.1] max-w-2xl"
        >
          Everything a video library isn&apos;t.
        </h2>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:auto-rows-fr">
          {/* ── Anchor cell: the AI tutor, shown as a live chat ── */}
          <article className="sm:col-span-2 lg:col-span-2 lg:row-span-2 relative overflow-hidden rounded-3xl bg-primary p-7 sm:p-9 text-white flex flex-col">
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-24 -right-24 w-80 h-80 rounded-full blur-3xl"
              style={{
                background:
                  "radial-gradient(circle, rgba(0,176,255,0.55) 0%, transparent 70%)",
              }}
            />
            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white ring-1 ring-white/20">
                Flagship
              </span>
              <h3
                style={DISPLAY}
                className="mt-5 text-[26px] sm:text-[32px] font-extrabold leading-tight"
              >
                A three-tier AI tutor,
                <br className="hidden sm:block" /> not a search box.
              </h3>
              <p className="mt-3 text-white/70 leading-relaxed max-w-md">
                Ask at the lesson, course, or roadmap level. It knows exactly what
                you&apos;re watching and answers in context — grounded in your own
                material, available 24/7.
              </p>
            </div>

            {/* faux tutor exchange */}
            <div className="relative mt-8 space-y-3 sm:mt-auto">
              <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-white/12 px-4 py-2.5 text-sm text-white/90 ring-1 ring-white/15">
                Why does this middleware run before the guard?
              </div>
              <div className="w-fit max-w-[90%] rounded-2xl rounded-bl-md bg-secondary px-4 py-2.5 text-sm font-medium text-slate-900 shadow-lg">
                In this lesson&apos;s bootstrap, cookie-parser is registered
                globally, so it fires before route guards. Want the exact line?
              </div>
            </div>
          </article>

          {/* ── remaining value props ── */}
          {CELLS.map((c) => {
            const Icon = c.icon;
            return (
              <article
                key={c.title}
                className="group rounded-3xl bg-white p-6 ring-1 ring-slate-900/5 shadow-[0_2px_16px_-8px_rgba(0,0,0,0.15)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-16px_rgba(59,24,146,0.35)]"
              >
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-primary/[0.06] text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <Icon className="w-5 h-5" aria-hidden />
                </div>
                <h3
                  style={DISPLAY}
                  className="mt-4 text-[17px] font-extrabold text-slate-900 leading-snug"
                >
                  {c.title}
                </h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-slate-500">
                  {c.body}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
