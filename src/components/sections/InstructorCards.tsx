"use client";

import Image from "next/image";
import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Instructor {
  id: number;
  name: string;
  role: string;
  avatar: string;
  fallbackInitials: string;
  fallbackGradient: string;
  rating: number;
  reviews: number;
  students: string;
  courses: number;
  badge: string;
  badgeBg: string;
  skills: string[];
  quote: string;
}

interface Testimonial {
  id: number;
  text: string;
  author: string;
  role: string;
  initials: string;
  gradient: string;
  rating: number;
  course: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const INSTRUCTORS: Instructor[] = [
  {
    id: 1,
    name: "Hedra Emad",
    role: "Senior Backend Engineer",
    avatar: "/images/instructors/hedra.jpg",
    fallbackInitials: "HE",
    fallbackGradient: "from-violet-600 to-blue-600",
    rating: 4.9,
    reviews: 3241,
    students: "8.2K",
    courses: 4,
    badge: "Top Instructor",
    badgeBg: "bg-violet-100 text-violet-700",
    skills: ["NestJS", "TypeScript", "MongoDB"],
    quote:
      "I design every lesson so that by the end, you could ship it to production tomorrow.",
  },
  {
    id: 2,
    name: "Aliaa Mohammed",
    role: "Frontend Lead @ TechCorp",
    avatar: "/images/instructors/aliaa.jpg",
    fallbackInitials: "AM",
    fallbackGradient: "from-sky-500 to-cyan-400",
    rating: 4.8,
    reviews: 1876,
    students: "6.1K",
    courses: 3,
    badge: "Staff Pick",
    badgeBg: "bg-sky-100 text-sky-700",
    skills: ["React 19", "Next.js 15", "Tailwind"],
    quote:
      "Modern frontend moves fast. My courses keep you ahead of the curve, always.",
  },
  {
    id: 3,
    name: "Nada Elhawary",
    role: "Data Scientist & AI Researcher",
    avatar: "/images/instructors/nada.jpg",
    fallbackInitials: "NH",
    fallbackGradient: "from-emerald-600 to-teal-400",
    rating: 4.9,
    reviews: 2540,
    students: "7.4K",
    courses: 5,
    badge: "Top Instructor",
    badgeBg: "bg-emerald-100 text-emerald-700",
    skills: ["Python", "Pandas", "ML"],
    quote:
      "Data is just numbers until you learn to make it tell a story. That's what I teach.",
  },
  {
    id: 4,
    name: "Fatma Mohamed",
    role: "Senior UI/UX Designer",
    avatar: "/images/instructors/fatma.jpg",
    fallbackInitials: "FM",
    fallbackGradient: "from-pink-600 to-orange-400",
    rating: 4.7,
    reviews: 1102,
    students: "4.8K",
    courses: 2,
    badge: "Rising Star",
    badgeBg: "bg-pink-100 text-pink-700",
    skills: ["Figma", "Design Systems", "UX Research"],
    quote:
      "Great design is invisible. I'll teach you to build products people love without knowing why.",
  },
];

const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    text: "Hedra's NestJS course is the most production-ready course I've ever taken. I shipped my first API to AWS within a week of finishing it.",
    author: "Mohamed Ashraf",
    role: "Backend Developer",
    initials: "MA",
    gradient: "from-violet-600 to-blue-600",
    rating: 5,
    course: "Full-Stack NestJS + TypeScript",
  },
  {
    id: 2,
    text: "The AI tutor inside the course answered questions specific to the exact lesson I was watching. It felt like having a personal mentor available 24/7.",
    author: "Sara Nour",
    role: "Frontend Engineer",
    initials: "SN",
    gradient: "from-sky-500 to-cyan-400",
    rating: 5,
    course: "React 19 & Next.js 15 Mastery",
  },
  {
    id: 3,
    text: "I went from zero Python to landing a data analyst role in 5 months. Nada's teaching style breaks down complex topics like nobody else.",
    author: "Youssef Salem",
    role: "Data Analyst @ Vodafone",
    initials: "YS",
    gradient: "from-emerald-600 to-teal-400",
    rating: 5,
    course: "Python for Data Science & AI",
  },
];

// ─── Star Rating ──────────────────────────────────────────────────────────────

function Stars({
  rating,
  size = "sm",
}: {
  rating: number;
  size?: "sm" | "md";
}) {
  const sz = size === "md" ? "text-base" : "text-[13px]";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          className={`${sz} leading-none select-none ${
            s <= Math.round(rating) ? "text-amber-400" : "text-gray-200"
          }`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

// ─── Instructor Card ──────────────────────────────────────────────────────────

function InstructorCard({ instructor }: { instructor: Instructor }) {
  const [imgError, setImgError] = useState(false);

  return (
    <article
      className="
        group bg-white rounded-2xl border border-slate-200 overflow-hidden
        flex flex-col
        shadow-[0_2px_12px_rgba(0,0,0,0.06)]
        hover:shadow-[0_14px_40px_rgba(0,0,0,0.11)]
        hover:-translate-y-1.5
        transition-all duration-300 cursor-pointer
      "
    >
      {/* ── top accent on hover ── */}
      <div
        className="
          h-[3px] w-full flex-shrink-0
          bg-gradient-to-r from-violet-500 to-blue-500
          scale-x-0 group-hover:scale-x-100
          transition-transform duration-300 origin-left
        "
      />

      {/* ── Avatar area  ·  fixed h-[160px] ── */}
      <div className="relative h-[160px] w-full flex-shrink-0 overflow-hidden bg-slate-100">
        {!imgError ? (
          <Image
            src={instructor.avatar}
            alt={instructor.name}
            fill
            sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,25vw"
            className="object-cover object-top"
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className={`
              absolute inset-0 flex items-end justify-center pb-4
              bg-gradient-to-br ${instructor.fallbackGradient}
            `}
          >
            <span className="text-5xl font-black text-white/30 select-none">
              {instructor.fallbackInitials}
            </span>
          </div>
        )}
        {/* dark scrim at bottom for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

        {/* badge */}
        <span
          className={`
            absolute top-3 right-3 z-10
            text-[10px] font-bold px-2.5 py-1 rounded-full
            ${instructor.badgeBg}
          `}
        >
          {instructor.badge}
        </span>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-col px-4 pt-4 pb-0 flex-1 overflow-hidden">
        {/* Name + Role  ·  fixed h-[52px] */}
        <div className="h-[52px] flex-shrink-0 overflow-hidden mb-3">
          <h3
            className="text-base text-slate-900 leading-tight line-clamp-1"
            style={{ fontWeight: 700 }}
          >
            {instructor.name}
          </h3>
          <p
            className="text-xs text-slate-400 mt-1 leading-tight line-clamp-2"
            style={{ fontWeight: 500 }}
          >
            {instructor.role}
          </p>
        </div>

        {/* Rating row  ·  fixed h-[22px] */}
        <div className="h-[22px] flex items-center gap-1.5 flex-shrink-0 mb-3">
          <Stars rating={instructor.rating} />
          <span className="text-xs font-bold text-amber-800 leading-none">
            {instructor.rating.toFixed(1)}
          </span>
          <span className="text-xs text-slate-400 leading-none">
            ({instructor.reviews.toLocaleString()})
          </span>
        </div>

        {/* Skills  ·  fixed h-[26px] */}
        <div className="h-[26px] flex items-center gap-1.5 flex-shrink-0 overflow-hidden mb-3">
          {instructor.skills.map((s) => (
            <span
              key={s}
              className="
                text-[10px] font-semibold bg-slate-100 text-slate-500
                border border-slate-200 px-2 py-[3px] rounded-full whitespace-nowrap
              "
            >
              {s}
            </span>
          ))}
        </div>

        {/* Quote  ·  fixed h-[56px] */}
        <div className="h-14 flex-shrink-0 overflow-hidden mb-0">
          <p className="text-xs text-slate-500 leading-relaxed italic line-clamp-3">
            "{instructor.quote}"
          </p>
        </div>
      </div>

      {/* ── Footer  ·  fixed h-[56px] ── */}
      <div
        className="
          h-14 flex items-center justify-between gap-2
          px-4 mt-3 border-t border-slate-100 flex-shrink-0
        "
      >
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center">
            <span className="text-sm font-black text-slate-900 leading-none">
              {instructor.students}
            </span>
            <span className="text-[10px] text-slate-400 leading-none mt-0.5">
              students
            </span>
          </div>
          <div className="w-px h-6 bg-slate-100" />
          <div className="flex flex-col items-center">
            <span className="text-sm font-black text-slate-900 leading-none">
              {instructor.courses}
            </span>
            <span className="text-[10px] text-slate-400 leading-none mt-0.5">
              courses
            </span>
          </div>
        </div>

        <button
          type="button"
          className="
            text-xs font-bold text-violet-600 border border-violet-200
            bg-violet-50 hover:bg-violet-600 hover:text-white hover:border-violet-600
            px-3 py-1.5 rounded-full
            transition-all duration-200
            whitespace-nowrap
          "
        >
          View Profile
        </button>
      </div>
    </article>
  );
}

// ─── Testimonial Card ─────────────────────────────────────────────────────────

function TestimonialCard({ t }: { t: Testimonial }) {
  return (
    <div
      className="
        bg-white rounded-2xl border border-slate-200 p-5
        shadow-[0_2px_12px_rgba(0,0,0,0.06)]
        hover:shadow-[0_8px_28px_rgba(0,0,0,0.09)]
        hover:-translate-y-1
        transition-all duration-300
        flex flex-col gap-3
      "
    >
      {/* stars */}
      <Stars rating={t.rating} size="md" />

      {/* quote */}
      <p className="text-sm text-slate-600 leading-relaxed flex-1">
        "{t.text}"
      </p>

      {/* course tag */}
      <span className="text-[10px] font-bold bg-violet-50 text-violet-600 border border-violet-100 px-2.5 py-1 rounded-full w-fit">
        {t.course}
      </span>

      {/* author */}
      <div className="flex items-center gap-2.5 pt-1 border-t border-slate-100">
        <div
          className={`
            w-8 h-8 rounded-full flex items-center justify-center
            text-[11px] font-black text-white flex-shrink-0
            bg-gradient-to-br ${t.gradient}
          `}
        >
          {t.initials}
        </div>
        <div>
          <p className="text-xs font-bold text-slate-900 leading-tight">
            {t.author}
          </p>
          <p className="text-[11px] text-slate-400 leading-tight">{t.role}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Section ─────────────────────────────────────────────────────────────

export default function InstructorsSpotlight() {
  return (
    <section className="bg-[#f0f2f5] py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1200px] mx-auto">
        {/* ── HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <span className="w-2 h-2 rounded-full bg-violet-600 inline-block flex-shrink-0" />
              <span className="text-xs font-bold tracking-widest text-violet-600 uppercase">
                Meet Your Mentors
              </span>
            </div>
            <h2
              className="text-[1.85rem] sm:text-4xl font-black text-slate-900 leading-tight tracking-tight mb-2"
              style={{ fontWeight: 800 }}
            >
              Learn from industry{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-blue-500">
                experts
              </span>
            </h2>
            <p className="text-sm text-slate-500 max-w-lg leading-relaxed">
              Every instructor on EduGenie passes a strict quality review. Real
              professionals, real experience, real results.
            </p>
          </div>

          <a
            href="/instructors"
            className="
              text-sm font-bold text-violet-600 hover:text-violet-800
              flex items-center gap-1 transition-all duration-200
              hover:gap-2 whitespace-nowrap flex-shrink-0
            "
          >
            View All Instructors →
          </a>
        </div>

        {/* ── INSTRUCTORS GRID ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
          {INSTRUCTORS.map((instructor) => (
            <InstructorCard key={instructor.id} instructor={instructor} />
          ))}
        </div>

        {/* ── DIVIDER WITH LABEL ── */}
        <div className="flex items-center gap-4 mb-10">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs font-bold tracking-widest text-slate-400 uppercase whitespace-nowrap">
            What our students say
          </span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* ── TESTIMONIALS GRID ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t) => (
            <TestimonialCard key={t.id} t={t} />
          ))}
        </div>

        {/* ── BECOME INSTRUCTOR BANNER ── */}
        <div
          className="
            mt-14 rounded-2xl border border-slate-200 bg-white
            px-6 py-8 sm:px-10 sm:py-10
            flex flex-col sm:flex-row items-center justify-between gap-6
            shadow-[0_2px_12px_rgba(0,0,0,0.06)]
          "
        >
          <div className="flex items-center gap-5">
            {/* icon cluster */}
            <div className="relative w-14 h-14 flex-shrink-0">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-2xl shadow-lg">
                🎓
              </div>
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center text-[9px]">
                ✦
              </div>
            </div>
            <div>
              <h3
                className="text-base sm:text-lg font-black text-slate-900 leading-tight"
                style={{ fontWeight: 800 }}
              >
                Become an Instructor
              </h3>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                Share your expertise and earn 80% of every course sale. Join
                200+ instructors already teaching on EduGenie.
              </p>
            </div>
          </div>

          <a
            href="/become-instructor"
            className="
              flex-shrink-0 inline-flex items-center gap-2
              px-7 py-3 rounded-full
              bg-gradient-to-r from-violet-600 to-blue-600
              text-white text-sm font-bold
              shadow-[0_4px_20px_rgba(124,58,237,0.35)]
              hover:shadow-[0_8px_30px_rgba(124,58,237,0.5)]
              hover:-translate-y-0.5
              transition-all duration-200
              whitespace-nowrap
            "
          >
            Start Teaching
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
