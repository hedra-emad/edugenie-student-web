"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Target, Trophy, Map, Zap, Globe, LucideIcon } from "lucide-react";
// ─── Types

interface Stat {
  value: string;
  label: string;
  suffix?: string;
}

interface Feature {
  id: number;
  icon: LucideIcon;
  title: string;
  description: string;
  accent: string; // tailwind bg color for icon bg
  accentText: string; // tailwind text color for icon
}

// ─── Data

const STATS: Stat[] = [
  { value: "50", suffix: "K+", label: "Active Students" },
  { value: "800", suffix: "+", label: "Expert Courses" },
  { value: "4.9", suffix: "★", label: "Average Rating" },
  { value: "98", suffix: "%", label: "Completion Rate" },
];

const FEATURES: Feature[] = [
  {
    id: 1,
    icon: Bot,
    title: "Three-Tier AI Tutor",
    description:
      "Get real-time AI guidance at lesson, course, and global roadmap levels — your 24/7 intelligent study companion that adapts to exactly what you're learning.",
    accent: "bg-violet-100",
    accentText: "text-violet-600",
  },
  {
    id: 2,
    icon: Target,
    title: "Mastery-Based Learning",
    description:
      "Our rigorous assessment engine with progress-reset policies ensures you genuinely understand every concept before advancing — zero passive watching.",
    accent: "bg-blue-100",
    accentText: "text-blue-600",
  },
  {
    id: 3,
    icon: Trophy,
    title: "Verified Certificates",
    description:
      "Earn auto-generated professional certificates showing your name, course, and final exam score — credentialed proof of mastery for employers.",
    accent: "bg-amber-100",
    accentText: "text-amber-600",
  },
  {
    id: 4,
    icon: Map,
    title: "Personalized Roadmaps",
    description:
      "Tell our Global AI Chatbot your career goal. It builds a custom, step-by-step learning path from your current skills to your dream role.",
    accent: "bg-emerald-100",
    accentText: "text-emerald-600",
  },
  {
    id: 5,
    icon: Zap,
    title: "Expert Instructors",
    description:
      "Every instructor passes a strict quality review. Ratings are calculated from real student feedback across fixed evaluation criteria — no padding.",
    accent: "bg-pink-100",
    accentText: "text-pink-600",
  },
  {
    id: 6,
    icon: Globe,
    title: "Learn Anywhere, Anytime",
    description:
      "Mobile-first, cloud-powered platform accessible on any device. Your progress, AI tutor, and certificates follow you everywhere.",
    accent: "bg-cyan-100",
    accentText: "text-cyan-600",
  },
];

// ─── Animated Counter

function useCountUp(target: number, duration = 1600, started: boolean) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else setCount(parseFloat(start.toFixed(1)));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, started]);

  return count;
}

function StatCard({ stat, started }: { stat: Stat; started: boolean }) {
  const num = parseFloat(stat.value);
  const animated = useCountUp(num, 1400, started);
  const display = Number.isInteger(num)
    ? Math.round(animated)
    : animated.toFixed(1);

  return (
    <div className="flex flex-col items-center text-center">
      <span className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-none">
        {display}
        <span className="text-violet-400">{stat.suffix}</span>
      </span>
      <span className="mt-2 text-sm text-slate-400 font-medium">
        {stat.label}
      </span>
    </div>
  );
}

// ─── Feature Card

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const Icon = feature.icon;
  return (
    <div
      className="
        group relative bg-white rounded-2xl p-6
        border border-slate-200
        shadow-[0_2px_12px_rgba(0,0,0,0.06)]
        hover:shadow-[0_12px_36px_rgba(0,0,0,0.11)]
        hover:-translate-y-1.5
        transition-all duration-300
        flex flex-col gap-4
      "
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* top accent line on hover */}
      <div
        className="
          absolute top-0 left-6 right-6 h-[3px] rounded-b-full
          bg-gradient-to-r from-violet-500 to-blue-500
          scale-x-0 group-hover:scale-x-100
          transition-transform duration-300 origin-left
        "
      />

      {/* Icon */}
      <div
        className={`
          w-12 h-12 rounded-xl flex items-center justify-center
          text-2xl flex-shrink-0 transition-transform duration-300
          group-hover:scale-110
          ${feature.accent}
        `}
      >
        <Icon
          className={`
      w-6 h-6
      ${feature.accentText}
    `}
        />
      </div>

      {/* Text */}
      <div className="flex flex-col gap-2">
        <h3 className="text-base font-bold text-slate-900 leading-snug">
          {feature.title}
        </h3>
        <p className="text-sm text-slate-500 leading-relaxed">
          {feature.description}
        </p>
      </div>
    </div>
  );
}

// ─── Main Section

export default function WhyChooseUs() {
  const sectionRef = useRef<HTMLElement>(null);
  const [statsVisible, setStatsVisible] = useState(false);

  // trigger counter animation when stats row enters viewport
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStatsVisible(true);
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-[#0d1117] py-20 px-4 sm:px-6 lg:px-8"
    >
      {/* ── background glow blobs ── */}
      <div
        aria-hidden
        className="
          pointer-events-none absolute -top-32 -left-32 w-[480px] h-[480px]
          rounded-full bg-violet-600/10 blur-3xl
        "
      />
      <div
        aria-hidden
        className="
          pointer-events-none absolute -bottom-32 -right-32 w-[420px] h-[420px]
          rounded-full bg-blue-600/10 blur-3xl
        "
      />

      <div className="relative max-w-[1200px] mx-auto">
        {/* ── HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-14">
          <div>
            {/* section tag — matches existing sections style */}
            <div className="flex items-center gap-1.5 mb-3">
              <span className="w-2 h-2 rounded-full bg-violet-500 inline-block flex-shrink-0" />
              <span className="text-xs font-bold tracking-widest text-violet-400 uppercase">
                Why EduGenie
              </span>
            </div>
            <h2
              className="text-[1.85rem] sm:text-4xl font-black text-white leading-tight tracking-tight"
              style={{ fontWeight: 800 }}
            >
              Learning,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-blue-400">
                reimagined
              </span>{" "}
              with AI
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-400 max-w-lg leading-relaxed">
              We don't just deliver courses — we make sure you truly master
              every concept through intelligent guidance and rigorous
              assessment.
            </p>
          </div>

          {/* CTA */}
          <a
            href="/courses"
            className="
              flex-shrink-0 inline-flex items-center gap-2
              px-6 py-3 rounded-full
              bg-gradient-to-r from-violet-600 to-blue-600
              text-white text-sm font-bold
              shadow-[0_4px_20px_rgba(124,58,237,0.45)]
              hover:shadow-[0_8px_30px_rgba(124,58,237,0.6)]
              hover:-translate-y-0.5
              transition-all duration-200
              whitespace-nowrap w-fit
            "
          >
            Start Learning Free
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="flex-shrink-0"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </div>

        {/* ── STATS STRIP ── */}
        <div
          className="
            grid grid-cols-2 sm:grid-cols-4 gap-px
            bg-white/[0.06] rounded-2xl overflow-hidden
            border border-white/[0.08] mb-14
          "
        >
          {STATS.map((stat, i) => (
            <div
              key={i}
              className="
                flex flex-col items-center justify-center
                bg-[#0d1117] py-8 px-4
                hover:bg-white/[0.03] transition-colors duration-200
              "
            >
              <StatCard stat={stat} started={statsVisible} />
            </div>
          ))}
        </div>

        {/* ── FEATURES GRID ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((feature, i) => (
            <FeatureCard key={feature.id} feature={feature} index={i} />
          ))}
        </div>

        {/* ── BOTTOM BANNER ── */}
        <div
          className="
            mt-14 rounded-2xl overflow-hidden
            bg-gradient-to-r from-violet-600 via-violet-700 to-blue-700
            p-px
          "
        >
          <div
            className="
              rounded-[15px] bg-gradient-to-r from-violet-600/20 via-[#0d1117] to-blue-600/20
              px-6 py-8 sm:px-10 sm:py-10
              flex flex-col sm:flex-row items-center justify-between gap-6
            "
          >
            <div className="text-center sm:text-left">
              <p className="text-xs font-bold tracking-widest text-violet-400 uppercase mb-2">
                Limited Time Offer
              </p>
              <h3
                className="text-xl sm:text-2xl font-black text-white leading-tight tracking-tight"
                style={{ fontWeight: 800 }}
              >
                Get your first course{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-blue-300">
                  completely free
                </span>
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                Join 50,000+ students already mastering their future with
                EduGenie.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 flex-shrink-0">
              <a
                href="/register"
                className="
                  px-7 py-3 rounded-full
                  bg-white text-slate-900 text-sm font-bold
                  hover:bg-slate-100 hover:shadow-lg
                  hover:-translate-y-0.5
                  transition-all duration-200
                  whitespace-nowrap
                "
              >
                Create Free Account →
              </a>
              <a
                href="/courses"
                className="
                  px-7 py-3 rounded-full
                  border border-white/25 text-white text-sm font-bold
                  hover:border-white/50 hover:bg-white/8
                  transition-all duration-200
                  whitespace-nowrap
                "
              >
                Browse Courses
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
