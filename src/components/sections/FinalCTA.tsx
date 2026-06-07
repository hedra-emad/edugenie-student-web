"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// ─── Types ──

interface TrustBadge {
  icon: string;
  label: string;
}

interface StatItem {
  value: string;
  label: string;
}

// ─── Data ──────

const TRUST_BADGES: TrustBadge[] = [
  { icon: "✓", label: "No credit card required" },
  { icon: "🤖", label: "AI Tutor included"       },
  { icon: "🏆", label: "Certificate on completion"},
  { icon: "⚡", label: "Cancel anytime"           },
];

const STATS: StatItem[] = [
  { value: "50K+", label: "Active Students"  },
  { value: "800+", label: "Expert Courses"   },
  { value: "4.9★", label: "Average Rating"   },
  { value: "98%",  label: "Completion Rate"  },
];

const AVATARS = [
  { initials: "MA", gradient: "from-violet-600 to-blue-600"   },
  { initials: "SR", gradient: "from-emerald-500 to-teal-500"  },
  { initials: "KF", gradient: "from-amber-500 to-orange-500"  },
  { initials: "LM", gradient: "from-pink-500 to-rose-500"     },
  { initials: "NA", gradient: "from-sky-500 to-cyan-400"      },
];

// ─── Main Section 

export default function FinalCTA() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible]   = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // helper — staggered fade-up classes
  const fadeUp = (delayClass: string) =>
    `transition-all duration-700 ${delayClass} ${
      visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
    }`;

  return (
    <section
      ref={sectionRef}
      className="relative bg-[#0d1117] overflow-hidden py-24 px-4 sm:px-6 lg:px-8"
    >
      {/* ── Background glows ── */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[700px] h-[400px] rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute -top-24  -left-24  w-64 h-64 rounded-full bg-violet-700/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full bg-blue-600/10  blur-3xl" />
        {/* grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,1) 1px,transparent 1px)," +
              "linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      {/* ── Content ── */}
      <div className="relative max-w-[800px] mx-auto flex flex-col items-center text-center gap-8">

        {/* Tag */}
        <div className={fadeUp("delay-0")}>
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/25 px-4 py-2 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-xs font-bold tracking-widest text-violet-400 uppercase">
              Start Your Journey Today
            </span>
          </div>
        </div>

        {/* Headline */}
        <div className={`flex flex-col gap-3 ${fadeUp("delay-100")}`}>
          <h2
            className="text-4xl sm:text-5xl lg:text-[3.25rem] font-black text-white leading-[1.1] tracking-tight"
            style={{ fontWeight: 800 }}
          >
            Your next career move
            <br />
            starts{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-400 to-blue-400">
              right here.
            </span>
          </h2>
          <p className="text-base sm:text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
            Join{" "}
            <span className="text-white font-bold">50,000+</span>{" "}
            students already mastering in-demand skills with AI-powered
            guidance and expert mentors.
          </p>
        </div>

        {/* Stats row */}
        <div className={`w-full ${fadeUp("delay-150")}`}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/[0.06] rounded-2xl overflow-hidden border border-white/[0.07]">
            {STATS.map((s, i) => (
              <div
                key={i}
                className="flex flex-col items-center justify-center gap-1 py-5 px-3
                           bg-[#0d1117] hover:bg-white/[0.03] transition-colors duration-200"
              >
                <span className="text-2xl sm:text-3xl font-black text-white leading-none tracking-tight">
                  {s.value}
                </span>
                <span className="text-xs text-slate-500 font-medium">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Social avatars */}
        <div className={`flex items-center gap-3 ${fadeUp("delay-200")}`}>
          <div className="flex">
            {AVATARS.map((av, i) => (
              <div
                key={i}
                className={`
                  w-9 h-9 rounded-full border-2 border-[#0d1117]
                  flex items-center justify-center
                  text-[10px] font-black text-white flex-shrink-0
                  bg-gradient-to-br ${av.gradient}
                  ${i !== 0 ? "-ml-2" : ""}
                `}
              >
                {av.initials}
              </div>
            ))}
            <div className="w-9 h-9 rounded-full border-2 border-[#0d1117] -ml-2
                            flex items-center justify-center
                            text-[9px] font-bold text-slate-300 bg-slate-800 flex-shrink-0">
              +50K
            </div>
          </div>
          <p className="text-sm text-slate-400">
            <span className="text-white font-semibold">4.9★</span> from 12,000+ reviews
          </p>
        </div>

        {/* CTA Buttons */}
        <div className={`flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto ${fadeUp("delay-[300ms]")}`}>
          <Link
            href="/register"
            className="
              w-full sm:w-auto
              inline-flex items-center justify-center gap-2
              px-8 py-4 rounded-full
              bg-gradient-to-r from-violet-600 to-blue-600
              text-white text-base font-bold
              shadow-[0_4px_24px_rgba(124,58,237,0.5)]
              hover:shadow-[0_8px_36px_rgba(124,58,237,0.65)]
              hover:-translate-y-0.5 active:scale-[0.98]
              transition-all duration-200 whitespace-nowrap
            "
          >
            Create Free Account
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>

          <Link
            href="/courses"
            className="
              w-full sm:w-auto
              inline-flex items-center justify-center gap-2
              px-8 py-4 rounded-full
              bg-white/6 border border-white/15
              text-white text-base font-bold
              hover:bg-white/10 hover:border-white/30
              hover:-translate-y-0.5 active:scale-[0.98]
              transition-all duration-200 whitespace-nowrap
            "
          >
            Browse Courses
          </Link>
        </div>

        {/* Trust badges */}
        <div className={`flex flex-wrap items-center justify-center gap-x-6 gap-y-2 ${fadeUp("delay-[400ms]")}`}>
          {TRUST_BADGES.map((badge, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="text-emerald-400 text-sm font-bold leading-none">
                {badge.icon}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {badge.label}
              </span>
            </div>
          ))}
        </div>

      </div>

      {/* ── Bottom divider ── */}
      <div className="relative max-w-[1200px] mx-auto mt-20">
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>
    </section>
  );
}