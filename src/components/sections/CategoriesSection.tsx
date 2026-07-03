"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import {
  Code2,        // Development
  Palette,      // UI/UX Design
  BarChart2,    // Data Science
  Cloud,        // Cloud & DevOps
  Bot,          // AI & Machine Learning
  Smartphone,   // Mobile Dev
  LucideIcon
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface CoursePreview {
  title: string;
  instructor: string;
  rating: number;
  students: string;
  price: string;
}

interface Category {
  // emoji: string;
  icon: LucideIcon;
  name: string;
  description: string;
  count: number;
  slug: string;
  gradient: string;
  chipBg: string;
  chipText: string;
  rippleColor: string;
  courses: CoursePreview[];
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const categories: Category[] = [
  {
    // emoji: "💻",
    icon: Code2,
    name: "Development",
    description: "Backend, Frontend, Full-Stack & more",
    count: 248,
    slug: "development",
    gradient: "from-violet-600 via-violet-700 to-blue-700",
    chipBg: "bg-violet-100",
    chipText: "text-violet-700",
    rippleColor: "rgba(139,92,246,0.25)",
    courses: [
      {
        title: "Full-Stack NestJS + TypeScript",
        instructor: "Kareem Hassan",
        rating: 4.9,
        students: "2.8K",
        price: "$89",
      },
      {
        title: "React 19 & Next.js 15 Mastery",
        instructor: "Aliaa Samir",
        rating: 4.8,
        students: "1.6K",
        price: "$79",
      },
      {
        title: "Node.js Microservices Architecture",
        instructor: "Omar Khalil",
        rating: 4.7,
        students: "1.1K",
        price: "$94",
      },
    ],
  },
  {
    // emoji: "🎨",
    icon: Palette,
    name: "UI/UX Design",
    description: "Figma, Design Systems & Prototyping",
    count: 124,
    slug: "design",
    gradient: "from-pink-500 via-rose-500 to-pink-700",
    chipBg: "bg-pink-100",
    chipText: "text-pink-700",
    rippleColor: "rgba(236,72,153,0.25)",
    courses: [
      {
        title: "UI/UX Design with Figma 2025",
        instructor: "Hedra Wagdy",
        rating: 4.7,
        students: "980",
        price: "$59",
      },
      {
        title: "Design Systems from Scratch",
        instructor: "Sara Nour",
        rating: 4.8,
        students: "730",
        price: "$69",
      },
      {
        title: "Mobile-First UX Research",
        instructor: "Mona Saleh",
        rating: 4.6,
        students: "520",
        price: "$54",
      },
    ],
  },
  {
    // emoji: "📊",
    icon: BarChart2,
    name: "Data Science",
    description: "Python, ML, Analytics & Visualization",
    count: 96,
    slug: "data-science",
    gradient: "from-cyan-600 via-teal-600 to-cyan-800",
    chipBg: "bg-cyan-100",
    chipText: "text-cyan-700",
    rippleColor: "rgba(8,145,178,0.25)",
    courses: [
      {
        title: "Python for Data Science & AI",
        instructor: "Nada Fouad",
        rating: 4.9,
        students: "3.1K",
        price: "$69",
      },
      {
        title: "Pandas & Data Visualization",
        instructor: "Ahmed Saber",
        rating: 4.7,
        students: "1.4K",
        price: "$64",
      },
      {
        title: "SQL for Data Analysts",
        instructor: "Rania Hassan",
        rating: 4.8,
        students: "890",
        price: "$49",
      },
    ],
  },
  {
    // emoji: "☁️",
    icon: Cloud,
    name: "Cloud & DevOps",
    description: "AWS, Docker, Kubernetes & CI/CD",
    count: 78,
    slug: "cloud-devops",
    gradient: "from-sky-500 via-blue-600 to-sky-700",
    chipBg: "bg-sky-100",
    chipText: "text-sky-700",
    rippleColor: "rgba(2,132,199,0.25)",
    courses: [
      {
        title: "AWS & Docker DevOps Bootcamp",
        instructor: "Ahmed Mostafa",
        rating: 4.8,
        students: "1.4K",
        price: "$99",
      },
      {
        title: "Kubernetes for Developers",
        instructor: "Hassan Ali",
        rating: 4.7,
        students: "760",
        price: "$89",
      },
      {
        title: "CI/CD with GitHub Actions",
        instructor: "Layla Omar",
        rating: 4.6,
        students: "540",
        price: "$74",
      },
    ],
  },
  {
    // emoji: "🤖",
    icon: Bot,
    name: "AI & Machine Learning",
    description: "LLMs, LangChain, Neural Networks",
    count: 64,
    slug: "ai-ml",
    gradient: "from-amber-500 via-orange-500 to-amber-700",
    chipBg: "bg-amber-100",
    chipText: "text-amber-700",
    rippleColor: "rgba(217,119,6,0.25)",
    courses: [
      {
        title: "Build AI Apps with LangChain",
        instructor: "Fatma Ali",
        rating: 4.9,
        students: "720",
        price: "$109",
      },
      {
        title: "Deep Learning with PyTorch",
        instructor: "Karim Nabil",
        rating: 4.8,
        students: "610",
        price: "$99",
      },
      {
        title: "Prompt Engineering Mastery",
        instructor: "Dina Hassan",
        rating: 4.7,
        students: "480",
        price: "$59",
      },
    ],
  },
  {
    // emoji: "📱",
    icon: Smartphone,
    name: "Mobile Dev",
    description: "React Native, Flutter & iOS/Android",
    count: 52,
    slug: "mobile",
    gradient: "from-emerald-600 via-green-600 to-emerald-800",
    chipBg: "bg-emerald-100",
    chipText: "text-emerald-700",
    rippleColor: "rgba(5,150,105,0.25)",
    courses: [
      {
        title: "React Native: iOS & Android",
        instructor: "Omar Khalil",
        rating: 4.8,
        students: "1.1K",
        price: "$74",
      },
      {
        title: "Flutter & Dart Complete Guide",
        instructor: "Yasmine Adel",
        rating: 4.7,
        students: "830",
        price: "$79",
      },
      {
        title: "App Store Optimization",
        instructor: "Amr Said",
        rating: 4.5,
        students: "340",
        price: "$44",
      },
    ],
  },
];

// ─── Stars helper ─────────────────────────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} className="w-3 h-3" viewBox="0 0 20 20">
          <path
            fill={s <= Math.round(rating) ? "#F59E0B" : "#E2E8F0"}
            d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
          />
        </svg>
      ))}
    </span>
  );
}

// ─── Big Category Card ────────────────────────────────────────────────────────
function CategoryCard({
  cat,
  isActive,
  onClick,
}: {
  cat: Category;
  isActive: boolean;
  onClick: () => void;
}) {
  // Material ripple
  const rippleRef = useRef<HTMLSpanElement>(null);

  const Icon = cat.icon;
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget.getBoundingClientRect();
    const span = rippleRef.current;
    if (!span) return;
    const size = Math.max(btn.width, btn.height) * 2;
    const x = e.clientX - btn.left - size / 2;
    const y = e.clientY - btn.top - size / 2;
    span.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px;`;
    span.classList.remove("animate-ripple");
    void span.offsetWidth;
    span.classList.add("animate-ripple");
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      className={`
        relative overflow-hidden text-left w-full
        rounded-2xl border-2 transition-all duration-250 ease-out
        focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500
        group
        ${
          isActive
            ? "border-transparent shadow-xl shadow-slate-200/80 scale-[1.01]"
            : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-lg hover:-translate-y-0.5"
        }
      `}
    >
      {/* ── Card Top — gradient header ── */}
      <div
        className={`
          bg-gradient-to-br ${cat.gradient}
          px-5 pt-5 pb-12 relative overflow-hidden
        `}
      >
        {/* subtle texture circles */}
        <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10" />
        <div className="absolute -bottom-10 -left-4 w-36 h-36 rounded-full bg-white/5" />

        <div className="relative z-10 flex items-start justify-between">
          <div>
            <span className="text-4xl leading-none mb-3 block">
              {/* {cat.emoji} */}
              {/* <Icon /> */}
               <Icon className="w-10 h-10 text-white mb-3" />
            </span>
            <h3 className="text-[17px] font-extrabold text-white tracking-tight leading-tight">
              {cat.name}
            </h3>
            <p className="text-white/70 text-[12px] mt-1 leading-snug max-w-[160px]">
              {cat.description}
            </p>
          </div>
          {/* Course count chip */}
          <span className="bg-white/20 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1 rounded-full border border-white/20 flex-shrink-0">
            {cat.count}+
          </span>
        </div>
      </div>

      {/* ── Card Body — course previews ── */}
      <div className="bg-white px-5 pt-4 pb-5 -mt-6 rounded-t-2xl relative z-10">
        {/* mini course list */}
        <div className="flex flex-col divide-y divide-slate-100">
          {cat.courses.map((course, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
            >
              {/* course info */}
              <div className="flex items-start gap-2.5 min-w-0">
                {/* tiny colored dot */}
                <span
                  className={`
                    mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0
                    bg-gradient-to-br ${cat.gradient}
                  `}
                />
                <div className="min-w-0">
                  <p className="text-[12px] font-bold text-slate-800 leading-snug line-clamp-1">
                    {course.title}
                  </p>
                  <p className="text-[10.5px] text-slate-400 mt-0.5 font-medium">
                    {course.instructor}
                  </p>
                </div>
              </div>
              {/* right side */}
              <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                <div className="flex items-center gap-1">
                  <Stars rating={course.rating} />
                  <span className="text-[10px] font-bold text-slate-600">
                    {course.rating}
                  </span>
                </div>
                <span className="text-[11px] font-extrabold text-slate-800">
                  {course.price}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* CTA row */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
          <span
            className={`text-[11px] font-bold ${cat.chipText} ${cat.chipBg} px-2.5 py-1 rounded-full`}
          >
            {cat.count} courses
          </span>
          <span
            className={`
              text-[12px] font-bold transition-colors duration-150
              ${isActive ? cat.chipText : "text-slate-400 group-hover:" + cat.chipText}
              flex items-center gap-1
            `}
          >
            Browse all
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </span>
        </div>
      </div>

      {/* Material ripple element */}
      <span
        ref={rippleRef}
        className="absolute rounded-full pointer-events-none opacity-0"
        style={{ background: cat.rippleColor }}
      />
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CategoriesSection() {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);


  return (
    <section className="bg-slate-50 border-y border-slate-200 py-16 px-4 sm:px-10 lg:px-16 xl:px-20">
      <div className="max-w-[1240px] mx-auto">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <p className="text-[11px] font-bold text-violet-700 tracking-[2px] uppercase mb-2">
              Browse by Category
            </p>
            <h2 className="text-[32px] sm:text-[38px] font-extrabold text-slate-900 tracking-tight leading-none">
              Find your path
            </h2>
            <p className="text-[15px] text-slate-500 mt-2.5 max-w-md leading-relaxed">
              Pick a category and explore the top-rated courses inside it.
            </p>
          </div>
          <Link
            href="/categories"
            className="text-[13px] font-bold text-violet-700 hover:text-violet-900 transition-colors whitespace-nowrap self-start sm:self-auto"
          >
            View All Categories →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((cat) => (
            <CategoryCard
              key={cat.slug}
              cat={cat}
              isActive={activeSlug === cat.slug}
              onClick={() =>
                setActiveSlug((prev) => (prev === cat.slug ? null : cat.slug))
              }
            />
          ))}
        </div>

        {/* ── Mobile bottom CTA ── */}
        <div className="mt-8 flex justify-center sm:hidden">
          <Link
            href="/categories"
            className={buttonClasses({ variant: "primary" })}
          >
            Browse All Categories →
          </Link>
        </div>
      </div>

      {/* Ripple keyframes */}
      <style>{`
        @keyframes ripple {
          to { transform: scale(1); opacity: 0; }
          from { transform: scale(0); opacity: 1; }
        }
        .animate-ripple {
          animation: ripple 0.5s linear;
        }
      `}</style>
    </section>
  );
}
