"use client";

import Image from "next/image";
import { useState } from "react";
import {
  Flame,
  Sparkles,
  Trophy,
  TrendingUp,
  Award,
  Heart,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type BadgeVariant = "hot" | "new" | "top" | "trending" | "bestseller";
type CategoryVariant =
  | "dev"
  | "design"
  | "data"
  | "ai"
  | "mobile"
  | "cloud"
  | "security";

interface Course {
  id: number;
  title: string;
  instructor: string;
  instructorInitials: string;
  instructorGradient: string;
  lessons: number;
  rating: number;
  reviews: number;
  price: number;
  originalPrice: number;
  category: string;
  categoryVariant: CategoryVariant;
  image: string; // ← صورة الكورس
  fallbackGradient: string; // ← لو الصورة مش موجودة
  badge: BadgeVariant;
  // badgeLabel: string;
}

type FilterKey =
  | "All"
  | "Development"
  | "UI/UX Design"
  | "Data Science"
  | "AI & ML"
  | "Cloud & DevOps";

// ─── Static Data ──────────────────────────────────────────────────────────────

const FILTERS: FilterKey[] = [
  "All",
  "Development",
  "UI/UX Design",
  "Data Science",
  "AI & ML",
  "Cloud & DevOps",
];

const COURSES: Course[] = [
  {
    id: 1,
    title: "Full-Stack NestJS + TypeScript — Zero to Production",
    instructor: "Kareem zayan",
    instructorInitials: "KZ",
    instructorGradient: "from-violet-600 to-blue-600",
    lessons: 24,
    rating: 4.9,
    reviews: 3241,
    price: 89,
    originalPrice: 199,
    category: "Web Development",
    categoryVariant: "dev",
    image: "/nestjs.jpg",
    fallbackGradient: "from-violet-900 via-violet-600 to-blue-600",
    badge: "hot",
    // badgeLabel: "🔥 Hot",
  },
  {
    id: 2,
    title: "React 19 & Next.js 15 Mastery — Modern Web Apps",
    instructor: "Hedra Emad",
    instructorInitials: "HE",
    instructorGradient: "from-sky-500 to-cyan-400",
    lessons: 32,
    rating: 4.8,
    reviews: 1876,
    price: 79,
    originalPrice: 169,
    category: "Web Development",
    categoryVariant: "dev",
    image: "/images/courses/react.jpg",
    fallbackGradient: "from-sky-900 via-sky-500 to-cyan-400",
    badge: "new",
    // badgeLabel: "✦ New",
  },
  {
    id: 3,
    title: "UI/UX Design with Figma 2025 — Complete Mastery",
    instructor: "Fatma Mohamed",
    instructorInitials: "FM",
    instructorGradient: "from-pink-600 to-orange-400",
    lessons: 20,
    rating: 4.7,
    reviews: 1102,
    price: 59,
    originalPrice: 129,
    category: "UI/UX Design",
    categoryVariant: "design",
    image: "/images/courses/figma.jpg",
    fallbackGradient: "from-rose-900 via-pink-500 to-orange-400",
    badge: "top",
    // badgeLabel: "⭐ Top",
  },
  {
    id: 4,
    title: "Python for Data Science & AI — From Zero to Pro",
    instructor: "Nada Elhawary",
    instructorInitials: "NE",
    instructorGradient: "from-emerald-600 to-teal-400",
    lessons: 28,
    rating: 4.9,
    reviews: 2540,
    price: 69,
    originalPrice: 149,
    category: "Data Science",
    categoryVariant: "data",
    image: "/images/courses/python.jpg",
    fallbackGradient: "from-emerald-900 via-emerald-500 to-teal-400",
    badge: "top",
    // badgeLabel: "⭐ Top",
  },
  {
    id: 5,
    title: "Build AI Apps with LangChain & OpenAI — Practical Guide",
    instructor: "Aliaa Mohammed",
    instructorInitials: "AM",
    instructorGradient: "from-amber-600 to-yellow-400",
    lessons: 36,
    rating: 4.9,
    reviews: 4218,
    price: 109,
    originalPrice: 219,
    category: "AI & ML",
    categoryVariant: "ai",
    image: "/images/courses/langchain.jpg",
    fallbackGradient: "from-amber-900 via-amber-500 to-yellow-400",
    badge: "trending",
    // badgeLabel: "📈 Trending",
  },
  {
    id: 6,
    title: "AWS & Docker DevOps Bootcamp — CI/CD Pipelines",
    instructor: "Mahmoud mouhamed",
    instructorInitials: "MM",
    instructorGradient: "from-blue-700 to-sky-400",
    lessons: 40,
    rating: 4.8,
    reviews: 986,
    price: 99,
    originalPrice: 199,
    category: "Cloud & DevOps",
    categoryVariant: "cloud",
    image: "/images/courses/aws.jpg",
    fallbackGradient: "from-blue-900 via-blue-600 to-sky-400",
    badge: "new",
    // badgeLabel: "✦ New",
  },
  {
    id: 7,
    title: "React Native — iOS & Android from Zero to Hero",
    instructor: "Omar Khalil",
    instructorInitials: "OK",
    instructorGradient: "from-purple-600 to-fuchsia-400",
    lessons: 44,
    rating: 4.8,
    reviews: 1334,
    price: 74,
    originalPrice: 159,
    category: "Web Development",
    categoryVariant: "mobile",
    image: "/images/courses/react-native.jpg",
    fallbackGradient: "from-purple-900 via-purple-600 to-fuchsia-400",
    badge: "bestseller",
    // badgeLabel: "💚 Best Seller",
  },
  {
    id: 8,
    title: "Pandas & Data Visualization — Analytics Masterclass",
    instructor: "Ahmed Saber",
    instructorInitials: "AS",
    instructorGradient: "from-teal-600 to-cyan-400",
    lessons: 26,
    rating: 4.7,
    reviews: 788,
    price: 64,
    originalPrice: 139,
    category: "Data Science",
    categoryVariant: "data",
    image: "/images/courses/pandas.jpg",
    fallbackGradient: "from-teal-900 via-teal-500 to-cyan-400",
    badge: "top",
    // badgeLabel: "⭐ Top",
  },
  {
    id: 9,
    title: "Ethical Hacking & Cybersecurity — Certified Prep 2025",
    instructor: "Rania Hassan",
    instructorInitials: "RH",
    instructorGradient: "from-stone-600 to-stone-400",
    lessons: 38,
    rating: 4.9,
    reviews: 2115,
    price: 89,
    originalPrice: 179,
    category: "Cloud & DevOps",
    categoryVariant: "security",
    image: "/images/courses/cybersecurity.jpg",
    fallbackGradient: "from-stone-900 via-stone-600 to-stone-400",
    badge: "trending",
    // badgeLabel: "📈 Trending",
  },
];

const FILTER_MAP: Record<FilterKey, CategoryVariant[]> = {
  All: ["dev", "design", "data", "ai", "mobile", "cloud", "security"],
  Development: ["dev", "mobile"],
  "UI/UX Design": ["design"],
  "Data Science": ["data"],
  "AI & ML": ["ai"],
  "Cloud & DevOps": ["cloud", "security"],
};

// ─── Lookup Maps ──────────────────────────────────────────────────────────────

const BADGE_STYLES: Record<BadgeVariant, string> = {
  hot: "bg-red-500/90 text-white",
  new: "bg-violet-600/90 text-white",
  top: "bg-amber-500/90 text-white",
  trending: "bg-blue-500/90 text-white",
  bestseller: "bg-emerald-500/90 text-white",
};
const BADGE_ICONS = {
  hot: Flame,
  new: Sparkles,
  top: Trophy,
  trending: TrendingUp,
  bestseller: Award,
};

const CATEGORY_STYLES: Record<CategoryVariant, string> = {
  dev: "bg-violet-100 text-violet-700",
  design: "bg-pink-100   text-pink-700",
  data: "bg-teal-100   text-teal-700",
  ai: "bg-amber-100  text-amber-700",
  mobile: "bg-purple-100 text-purple-700",
  cloud: "bg-blue-100   text-blue-700",
  security: "bg-stone-100  text-stone-700",
};

// ─── StarRating ───────────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          className={`text-[13px] leading-none select-none ${
            s <= Math.round(rating) ? "text-amber-400" : "text-gray-300"
          }`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

// ─── WishlistButton

function WishlistButton() {
  const [wished, setWished] = useState(false);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setWished(!wished);
      }}
      aria-label="Wishlist"
      className={`
        w-9 h-9 rounded-full
        flex items-center justify-center
        backdrop-blur-md
        border transition-all duration-300
        ${
          wished
            ? "bg-red-500/20 border-red-500/40"
            : "bg-white/15 border-white/20 hover:bg-white/25"
        }
      `}
    >
      <Heart
        className={`
          w-4 h-4 transition-all duration-300
          ${wished ? "fill-red-500 text-red-500" : "text-white"}
        `}
      />
    </button>
  );
}

function CourseCard({ course }: { course: Course }) {
  const [imgError, setImgError] = useState(false);
  const BadgeIcon = BADGE_ICONS[course.badge];
  const discount = Math.round(
    ((course.originalPrice - course.price) / course.originalPrice) * 100,
  );

  return (
    <article
      className="
        group bg-white rounded-2xl border border-slate-200 overflow-hidden
        flex flex-col
        shadow-[0_2px_12px_rgba(0,0,0,0.07)]
        hover:-translate-y-1.5 hover:shadow-[0_14px_40px_rgba(0,0,0,0.13)]
        transition-all duration-300 cursor-pointer
      "
    >
      {/* ── THUMBNAIL — exact 168 px, never grows or shrinks ── */}
      <div className="relative h-[168px] w-full flex-shrink-0 overflow-hidden">
        {/* Image or gradient fallback — both fill the fixed box */}
        {!imgError ? (
          <Image
            src={course.image}
            alt={course.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover object-center"
            onError={() => setImgError(true)}
            priority={course.id <= 3}
          />
        ) : (
          /* Gradient shown when image is missing / 404 */
          <div
            className={`absolute inset-0 bg-gradient-to-br ${course.fallbackGradient}`}
          />
        )}

        {/* dark scrim so badges stay readable over any image */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

        {/* Badge — top-right */}

        {/* <span
          className={`
            absolute top-3 right-3 z-10
            text-[11px] font-bold px-2.5 py-1 rounded-full
            ${BADGE_STYLES[course.badge]}
          `}
        >
          {course.badgeLabel}
        </span> */}
        <span
          className={`
    absolute top-3 right-3 z-10
    w-9 h-9 rounded-full
    flex items-center justify-center
    backdrop-blur-xl
    shadow-lg border border-white/20
    ${BADGE_STYLES[course.badge]}
  `}
        >
          <BadgeIcon className="w-4 h-4 text-white" />
        </span>

        {/* Wishlist — top-left */}

        <div className="absolute top-3 left-3 z-30">
          <WishlistButton />
        </div>

        {/* Hover overlay — Preview button */}
        <div
          className="
            absolute inset-0 z-20 flex items-center justify-center
            bg-black/50 backdrop-blur-[2px]
            opacity-0 group-hover:opacity-100 transition-opacity duration-300
          "
        >
          <button
            type="button"
            className="
              bg-white text-slate-900 text-xs font-bold px-5 py-2.5 rounded-full
              translate-y-2 group-hover:translate-y-0 transition-transform duration-300
              shadow-lg
            "
          >
            Preview Course
          </button>
        </div>
      </div>

      {/* ── BODY — fixed-height rows, no flex-grow ── */}
      <div className="flex flex-col px-4 pt-4 pb-0 overflow-hidden">
        {/* Row 1 — Category tag  ·  h-6 (24px) */}
        <div className="h-6 flex items-center mb-2 flex-shrink-0">
          <span
            className={`
              text-[11px] font-bold uppercase tracking-wider leading-none
              px-2.5 py-[3px] rounded-full whitespace-nowrap
              ${CATEGORY_STYLES[course.categoryVariant]}
            `}
          >
            {course.category}
          </span>
        </div>

        {/* Row 2 — Title  ·  h-14 (56px) — 3-line clamp */}
        <div className="h-14 mb-3 flex-shrink-0 overflow-hidden">
          <h3
            className="text-sm leading-[1.4] text-slate-900 line-clamp-3"
            style={{ fontWeight: 700 }}
          >
            {course.title}
          </h3>
        </div>

        {/* Row 3 — Instructor  ·  h-7 (28px) */}
        <div className="h-7 flex items-center gap-2 mb-3 flex-shrink-0 overflow-hidden">
          <div
            className={`
              w-6 h-6 rounded-full flex items-center justify-center
              text-[9px] font-black text-white flex-shrink-0
              bg-gradient-to-br ${course.instructorGradient}
            `}
          >
            {course.instructorInitials}
          </div>
          <span
            className="text-xs text-slate-500 truncate min-w-0"
            style={{ fontWeight: 500 }}
          >
            {course.instructor}
          </span>
          <span className="text-slate-300 text-xs flex-shrink-0">·</span>
          <span className="text-xs text-slate-400 flex-shrink-0 whitespace-nowrap">
            {course.lessons} lessons
          </span>
        </div>

        {/* Row 4 — Rating  ·  h-[22px] */}
        <div className="h-[22px] flex items-center gap-1.5 flex-shrink-0">
          <StarRating rating={course.rating} />
          <span className="text-xs font-bold text-amber-800 leading-none">
            {course.rating.toFixed(1)}
          </span>
          <span className="text-xs text-slate-400 leading-none">
            ({course.reviews.toLocaleString()})
          </span>
        </div>
      </div>

      {/* ── FOOTER — fixed h-[60px], always at the bottom ── */}
      <div
        className="
          h-[60px] flex items-center justify-between gap-2
          px-4 mt-3 border-t border-slate-100 flex-shrink-0
        "
      >
        {/* Price block */}
        <div className="flex items-baseline gap-1 flex-wrap">
          <span className="text-[17px] font-black text-slate-900 leading-none tracking-tight">
            ${course.price}
          </span>
          <span className="text-xs text-slate-400 line-through leading-none">
            ${course.originalPrice}
          </span>
          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-[3px] rounded-full whitespace-nowrap">
            {discount}% OFF
          </span>
        </div>

        {/* Enroll button */}
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="
            bg-[#3B1892] hover:bg-violet-700 text-white
            text-xs font-bold px-4 py-2 rounded-full flex-shrink-0
            transition-all duration-200
            hover:shadow-[0_4px_14px_rgba(124,58,237,0.45)]
            hover:-translate-y-px active:scale-95
            whitespace-nowrap
          "
        >
          Enroll Now →
        </button>
      </div>
    </article>
  );
}

// ─── FeaturedCourses Section
export default function FeaturedCourses() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("All");
  const [visibleCount, setVisibleCount] = useState(6);

  const filtered = COURSES.filter((c) =>
    FILTER_MAP[activeFilter].includes(c.categoryVariant),
  );
  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <section className="bg-[#f0f2f5] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1200px] mx-auto">
        {/* ── HEADER ── */}
        <div className="flex items-end justify-between gap-4 mb-8 flex-wrap">
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="w-2 h-2 rounded-full bg-violet-600 inline-block flex-shrink-0" />
              <span className="text-xs font-bold tracking-widest text-violet-600 uppercase">
                Featured Courses
              </span>
            </div>
            <h2
              className="text-[1.85rem] font-black text-slate-900 leading-tight tracking-tight mb-1"
              style={{ fontWeight: 800 }}
            >
              Handpicked for your growth
            </h2>
            <p className="text-sm text-slate-500">
              Top-rated courses selected by our experts — loved by thousands of
              students.
            </p>
          </div>

          <a
            href="/courses"
            className="
              text-sm font-bold text-violet-600 hover:text-violet-800
              flex items-center gap-1 transition-all duration-200
              hover:gap-2 whitespace-nowrap flex-shrink-0
            "
          >
            View All Courses →
          </a>
        </div>

        {/* ── FILTER TABS ── */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => {
                setActiveFilter(f);
                setVisibleCount(6);
              }}
              className={`
                px-4 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap
                border transition-all duration-200 flex-shrink-0
                ${
                  activeFilter === f
                    ? "bg-[#3B1892] text-white border-violet-600 shadow-[0_4px_16px_rgba(124,58,237,0.35)]"
                    : "bg-white text-slate-500 border-slate-200 hover:border-violet-400 hover:text-violet-600"
                }
              `}
            >
              {f}
            </button>
          ))}
        </div>

        {/* ── GRID ── */}
        {visible.length > 0 ? (
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <span className="text-5xl mb-4 select-none">🔍</span>
            <p className="text-base font-semibold">
              No courses in this category yet.
            </p>
            <p className="text-sm mt-1">Check back soon — more are coming!</p>
          </div>
        )}

        {/* ── LOAD MORE ── */}
        {hasMore && (
          <div className="flex justify-center mt-11">
            <button
              type="button"
              onClick={() => setVisibleCount((p) => p + 3)}
              className="
                flex items-center gap-2 px-8 py-3 rounded-full
                text-sm font-bold text-violet-600
                border-2 border-violet-600
                hover:bg-violet-600 hover:text-white
                hover:shadow-[0_6px_24px_rgba(124,58,237,0.4)]
                hover:-translate-y-0.5 active:scale-95
                transition-all duration-200
              "
            >
              Load More Courses
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="flex-shrink-0"
              >
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
