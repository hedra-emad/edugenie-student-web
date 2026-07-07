import { LucideIcon, Flame, Sparkles, Trophy } from "lucide-react";
import Link from "next/link";
import SearchBar from "@/components/sections/SearchBar";

// ─── Types ────
interface TrendingTag {
  label: string;
  href: string;
}

export interface MiniCourse {
  id: string;
  icon: LucideIcon;
  gradient: string;
  title: string;
  instructor: string;
  lessons: number;
  rating: number;
  badge: "new";
}

// ─── Static Data
const trendingTags: TrendingTag[] = [
  { label: "NestJS", href: "/courses?q=nestjs" },
  { label: "React 19", href: "/courses?q=react" },
  { label: "Python", href: "/courses?q=python" },
  { label: "UI/UX Design", href: "/courses?q=uiux" },
  { label: "Machine Learning", href: "/courses?q=ml" },
];

const stats = [
  { value: "50K+", label: "Active Students" },
  { value: "800+", label: "Expert Courses" },
  { value: "4.9★", label: "Avg. Rating" },
  { value: "98%", label: "Completion Rate" },
];

// ─── Badge Config
const badgeConfig = {
  hot: {
    label: "Hot",
    icon: Flame,
    className: "bg-red-950/60 text-red-300 border border-red-800/40",
  },
  new: {
    label: "New",
    icon: Sparkles,
    className: "bg-violet-950/60 text-violet-300 border border-violet-700/40",
  },
  top: {
    label: "Top",
    icon: Trophy,
    className: "bg-amber-950/60 text-amber-300 border border-amber-700/40",
  },
};

// ─── Sub-components

function MiniCourseCard({ course }: { course: MiniCourse }) {
  const badge = badgeConfig[course.badge];
  const Icon = course.icon;
  const BadgeIcon = badge.icon;
  return (
    <Link
      href={`/courses/${course.id}`}
      className="
        flex items-center gap-3 px-4 py-3
        bg-white/[0.06] hover:bg-white/[0.10]
        border border-white/10 hover:border-violet-500/40
        rounded-2xl cursor-pointer transition-all duration-200
        group
      "
    >
      {/* Thumbnail */}
      <div
        className={`
          w-12 h-12 rounded-xl bg-gradient-to-br ${course.gradient}
          flex items-center justify-center text-xl flex-shrink-0
          shadow-lg
        `}
      >
        {/* {course.emoji} */}
        <Icon className="w-6 h-6 text-white drop-shadow-md" />
        {/* <Icon className="w-6 h-6 text-white" /> */}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white truncate group-hover:text-violet-200 transition-colors">
          {course.title}
        </p>
        <p className="text-xs text-white/40 mt-0.5">
          {course.instructor} · {course.lessons} lessons · {course.rating}★
        </p>
      </div>

      {/* Badge */}

      <span
        className={`
    inline-flex items-center gap-1.5
    text-[11px] font-bold px-2.5 py-1 rounded-full
    flex-shrink-0
    ${badge.className}
  `}
      >
        <BadgeIcon className="w-3 h-3" />
        <span>{badge.label}</span>
      </span>
    </Link>
  );
}

// ─── Main Component
export default function HeroBanner({
  miniCourses,
}: {
  miniCourses: MiniCourse[];
}) {
  return (
    <section
      className="
        relative overflow-hidden
        bg-[#0A1628]
        px-6 sm:px-10 lg:px-16 xl:px-20
        pt-20 pb-20
      "
    >
      {/* ── Background Glows ── */}
      <div
        aria-hidden
        className="
          pointer-events-none absolute -top-32 -right-32 w-[560px] h-[560px]
          rounded-full
          
          "
        // #3B1892
      />
      <div
        aria-hidden
        className="
          pointer-events-none absolute bottom-0 left-[20%] w-[360px] h-[360px]
          rounded-full
        
        "
      />
      {/* Subtle grid texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />

      {/* ── Content Grid ── */}
      <div className="relative z-10 max-w-[1240px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/*  LEFT — Copy  */}
        <div>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-violet-500/15 border border-violet-400/25 text-violet-300 rounded-full px-4 py-1.5 text-xs font-bold tracking-widest uppercase mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.9)]" />
            Intelligent Learning Ecosystem
          </div>

          {/* Headline */}
          <h1 className="text-[44px] sm:text-5xl lg:text-[52px] font-extrabold leading-[1.08] tracking-tight text-white mb-5">
            Learn to Code. <br className="hidden sm:block" />
            Build the Future. <br />
            <span className="text-violet-400">Land the Job.</span>
          </h1>

          {/* Sub */}
          <p className="text-lg text-white/55 leading-relaxed mb-9 max-w-[460px]">
            Access 800+ expert-led courses in coding, design, and data science.
            AI-guided paths that adapt to your goals and pace.
          </p>

          {/* Search */}
          <SearchBar />

          {/* Trending Tags */}
          <div className="flex flex-wrap items-center gap-2 mt-5">
            <span className="text-xs text-white/35 font-semibold">
              Trending:
            </span>
            {trendingTags.map((tag) => (
              <Link
                key={tag.label}
                href={tag.href}
                className="
                  text-xs font-medium text-white/60
                  bg-white/[0.07] hover:bg-violet-500/20
                  border border-white/10 hover:border-violet-500/40
                  hover:text-violet-300
                  px-3 py-1.5 rounded-full transition-all duration-150
                "
              >
                {tag.label}
              </Link>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mt-11 pt-9 border-t border-white/10">
            {stats.map((s) => (
              <div key={s.label}>
                <strong className="block text-[26px] font-extrabold text-white tracking-tight leading-none">
                  {s.value}
                </strong>
                <span className="block text-xs text-white/35 font-medium mt-1.5">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/*  RIGHT — Course Preview  */}
        <div className="flex flex-col gap-3">
          {miniCourses.map((course) => (
            <MiniCourseCard key={course.title} course={course} />
          ))}
        </div>
      </div>
    </section>
  );
}
