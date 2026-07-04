"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Sparkles, ShieldCheck, ArrowRight, Bot } from "lucide-react";

const DISPLAY = { fontFamily: "var(--font-hanken-grotesk)" } as const;

const trust = [
  { value: "50K+", label: "Active students" },
  { value: "800+", label: "Expert courses" },
  { value: "4.9★", label: "Avg. rating" },
  { value: "98%", label: "Finish & pass" },
];

function SearchBar() {
  const [query, setQuery] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const q = query.trim();
        window.location.href = q
          ? `/courses?q=${encodeURIComponent(q)}`
          : "/courses";
      }}
      className="flex items-center gap-2 bg-white rounded-2xl p-2 pl-4 shadow-[0_12px_40px_-12px_rgba(59,24,146,0.35)] ring-1 ring-slate-900/5"
    >
      <Search className="w-5 h-5 text-slate-400 shrink-0" aria-hidden />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search 800+ courses…"
        aria-label="Search courses"
        className="flex-1 min-w-0 bg-transparent outline-none text-[15px] text-slate-800 placeholder:text-slate-400 font-medium"
      />
      <button
        type="submit"
        className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 sm:px-5 py-2.5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        Search
      </button>
    </form>
  );
}

export default function HeroV2() {
  return (
    <section className="relative overflow-hidden bg-[#F4F7F9]">
      {/* Aurora wash — brand purple→cyan, kept low so it reads as light, not dark */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-32 w-[620px] h-[620px] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(59,24,146,0.16) 0%, transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-24 -right-24 w-[520px] h-[520px] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(0,176,255,0.16) 0%, transparent 70%)",
        }}
      />

      <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-16 grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-10 items-center">
        {/* ── LEFT: copy ── */}
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-primary ring-1 ring-primary/15">
            <Sparkles className="w-3.5 h-3.5" aria-hidden />
            AI-guided mastery
          </div>

          <h1
            style={DISPLAY}
            className="mt-6 text-[40px] leading-[1.03] sm:text-[54px] lg:text-[60px] font-extrabold tracking-tight text-slate-900"
          >
            Don&apos;t just take courses.{" "}
            <span className="relative whitespace-nowrap">
              <span className="relative z-10 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Master them.
              </span>
              {/* hand-drawn underline — the one flourish */}
              <svg
                aria-hidden
                viewBox="0 0 300 14"
                className="absolute -bottom-2 left-0 w-full h-3"
                preserveAspectRatio="none"
              >
                <path
                  d="M2 9 C 70 2, 150 2, 298 7"
                  fill="none"
                  stroke="url(#hg)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="hg" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor="#3B1892" />
                    <stop offset="1" stopColor="#00B0FF" />
                  </linearGradient>
                </defs>
              </svg>
            </span>
          </h1>

          <p className="mt-6 text-[17px] leading-relaxed text-slate-600 max-w-[520px]">
            Every course comes with an AI tutor and a mastery-gated path — so you
            finish <em className="not-italic font-semibold text-slate-800">knowing</em> the
            material, then follow a roadmap straight to the role you want.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link
              href="/roadmap"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-[15px] font-bold text-white shadow-[0_12px_30px_-8px_rgba(59,24,146,0.6)] transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Build my roadmap
              <ArrowRight className="w-4 h-4" aria-hidden />
            </Link>
            <Link
              href="/courses"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-[15px] font-bold text-slate-800 ring-1 ring-slate-900/10 transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Browse courses
            </Link>
          </div>

          <div className="mt-6 max-w-[520px]">
            <SearchBar />
          </div>

          {/* trust strip */}
          <dl className="mt-9 grid grid-cols-4 gap-3 sm:gap-6 border-t border-slate-900/10 pt-6">
            {trust.map((t) => (
              <div key={t.label}>
                <dt className="sr-only">{t.label}</dt>
                <dd
                  style={DISPLAY}
                  className="text-[22px] sm:text-[26px] font-extrabold tracking-tight text-slate-900 leading-none"
                >
                  {t.value}
                </dd>
                <span className="mt-1.5 block text-[11px] sm:text-xs font-medium text-slate-500">
                  {t.label}
                </span>
              </div>
            ))}
          </dl>
        </div>

        {/* ── RIGHT: the product, shown not told — a live "roadmap" widget ── */}
        <div className="relative">
          <div
            aria-hidden
            className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-primary/10 to-secondary/10 blur-2xl"
          />
          <div className="relative rounded-[1.75rem] bg-white p-5 sm:p-6 shadow-[0_30px_70px_-25px_rgba(59,24,146,0.45)] ring-1 ring-slate-900/5">
            {/* widget header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  Your AI roadmap
                </p>
                <p
                  style={DISPLAY}
                  className="text-lg font-extrabold text-slate-900"
                >
                  Backend Engineer
                </p>
              </div>
              {/* progress ring */}
              <div className="relative w-14 h-14 shrink-0">
                <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
                  <circle
                    cx="18"
                    cy="18"
                    r="15.5"
                    fill="none"
                    stroke="#EEF1F6"
                    strokeWidth="4"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.5"
                    fill="none"
                    stroke="url(#ring)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray="97.4"
                    strokeDashoffset="37"
                  />
                  <defs>
                    <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0" stopColor="#3B1892" />
                      <stop offset="1" stopColor="#00B0FF" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="absolute inset-0 grid place-items-center text-[13px] font-black text-slate-900">
                  62%
                </span>
              </div>
            </div>

            {/* mini steps */}
            <ol className="mt-5 space-y-2.5">
              {[
                { t: "Placement test", s: "done", d: "Skipped 3 modules you knew" },
                { t: "NestJS fundamentals", s: "done", d: "Mastery 94%" },
                { t: "Auth & databases", s: "active", d: "In progress · AI tutor on" },
                { t: "Deploy & certify", s: "todo", d: "Verified certificate" },
              ].map((step) => (
                <li
                  key={step.t}
                  className={`flex items-center gap-3 rounded-2xl p-3 ring-1 transition-colors ${
                    step.s === "active"
                      ? "bg-primary/[0.04] ring-primary/20"
                      : "bg-slate-50/70 ring-slate-900/5"
                  }`}
                >
                  <span
                    className={`grid place-items-center w-8 h-8 rounded-xl text-white shrink-0 ${
                      step.s === "done"
                        ? "bg-[#22C55E]"
                        : step.s === "active"
                          ? "bg-gradient-to-br from-primary to-secondary"
                          : "bg-slate-300"
                    }`}
                  >
                    {step.s === "done" ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                    ) : step.s === "active" ? (
                      <Bot className="w-4 h-4" aria-hidden />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-white/90" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-slate-900 truncate">
                      {step.t}
                    </span>
                    <span className="block text-[11px] text-slate-500 truncate">
                      {step.d}
                    </span>
                  </span>
                </li>
              ))}
            </ol>

            <div className="mt-5 flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-white">
              <ShieldCheck className="w-4 h-4 text-secondary shrink-0" aria-hidden />
              <p className="text-[12px] font-medium leading-snug">
                Next step unlocks only when you pass — no skipping ahead.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
