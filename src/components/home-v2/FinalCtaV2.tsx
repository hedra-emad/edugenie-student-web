import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

const DISPLAY = { fontFamily: "var(--font-hanken-grotesk)" } as const;

export default function FinalCtaV2() {
  return (
    <section className="bg-white px-4 sm:px-6 lg:px-8 pb-20">
      <div className="max-w-[1200px] mx-auto">
        <div className="relative overflow-hidden rounded-[2rem] bg-primary px-6 py-14 sm:px-14 sm:py-20 text-center">
          {/* brand aurora */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 left-1/4 w-[420px] h-[420px] rounded-full blur-3xl"
            style={{
              background:
                "radial-gradient(circle, rgba(0,176,255,0.5) 0%, transparent 70%)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-28 right-1/4 w-[420px] h-[420px] rounded-full blur-3xl"
            style={{
              background:
                "radial-gradient(circle, rgba(91,61,184,0.6) 0%, transparent 70%)",
            }}
          />

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white ring-1 ring-white/20">
              <Sparkles className="w-3.5 h-3.5" aria-hidden />
              Free to start
            </div>
            <h2
              style={DISPLAY}
              className="mx-auto mt-6 max-w-2xl text-[2rem] sm:text-[3rem] font-extrabold leading-[1.05] tracking-tight text-white"
            >
              Your future self is one{" "}
              <span className="bg-gradient-to-r from-secondary to-white bg-clip-text text-transparent">
                roadmap
              </span>{" "}
              away.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[15px] sm:text-lg text-white/70 leading-relaxed">
              Tell us where you want to be. We&apos;ll build the path, teach it,
              and make sure you master every step.
            </p>

            <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/roadmap"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-[15px] font-bold text-primary transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Build my roadmap
                <ArrowRight className="w-4 h-4" aria-hidden />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-7 py-3.5 text-[15px] font-bold text-white ring-1 ring-white/25 transition-colors hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Create free account
              </Link>
            </div>

            <p className="mt-6 text-[13px] text-white/55">
              Teach on EduGenie instead?{" "}
              <Link
                href="/become-instructor"
                className="font-semibold text-white underline decoration-white/40 underline-offset-2 hover:decoration-white"
              >
                Earn 80% of every sale →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
