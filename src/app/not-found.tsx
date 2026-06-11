"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BookOpen, Home, Search, ArrowLeft, Compass } from "lucide-react";

const QUICK_LINKS = [
  { href: "/courses", icon: <BookOpen size={16} />, label: "Browse Courses" },
  { href: "/categories", icon: <Compass size={16} />, label: "All Categories" },
  { href: "/", icon: <Home size={16} />, label: "Back to Home" },
];

// ─── Main 404 Page

export default function NotFound() {
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // entrance animation trigger
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  // subtle particle canvas — dots that drift upward slowly
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const dots = Array.from({ length: 40 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.4,
      speed: Math.random() * 0.4 + 0.1,
      opacity: Math.random() * 0.4 + 0.05,
    }));

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      dots.forEach((d) => {
        d.y -= d.speed;
        if (d.y < -4) {
          d.y = canvas.height + 4;
          d.x = Math.random() * canvas.width;
        }
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139,92,246,${d.opacity})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const fadeUp = (extra = "") =>
    `transition-all duration-700 ${extra} ${
      visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
    }`;

  return (
    <main
      className="relative min-h-screen bg-[#0d1117] overflow-hidden
                     flex flex-col items-center justify-center px-4 py-16"
    >
      {/* ── particle canvas ── */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 w-full h-full"
        aria-hidden
      />

      {/* ── background glows ── */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[600px] h-[600px] rounded-full
                        bg-[#3B1892]/10 blur-[100px]"
        />
        <div
          className="absolute top-0 left-0 w-80 h-80 rounded-full
                        bg-violet-800/8 blur-3xl"
        />
        <div
          className="absolute bottom-0 right-0 w-80 h-80 rounded-full
                        bg-blue-700/8 blur-3xl"
        />
        {/* grid */}
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

      {/* ── core content ── */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-xl w-full gap-8">
        {/* Logo */}
        <div className={fadeUp("delay-0")}>
          <Link
            href="/"
            className="flex items-center gap-2.5 group w-fit mx-auto"
          >
            <div
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3B1892] to-blue-600
                            flex items-center justify-center
                            group-hover:shadow-[0_0_20px_rgba(91,33,182,0.6)]
                            transition-shadow duration-300"
            >
              <BookOpen size={18} className="text-white" />
            </div>
            <span className="text-lg font-black tracking-tight">
              <span className="text-violet-300">Edu</span>
              <span
                className="text-transparent bg-clip-text
                               bg-gradient-to-r from-blue-400 to-cyan-400"
              >
                Genie
              </span>
            </span>
          </Link>
        </div>

        {/* 404 number */}
        <div className={`relative select-none ${fadeUp("delay-100")}`}>
          {/* icon in center */}
          <div className="relative flex flex-col items-center gap-4 py-10 sm:py-14">
            <div
              className="
              w-24 h-24 rounded-3xl
              bg-gradient-to-br from-[#3B1892]/40 to-blue-600/20
              border border-[#3B1892]/30
              flex items-center justify-center
              shadow-[0_0_40px_rgba(91,33,182,0.25)]
            "
            >
              <Compass
                size={44}
                className="text-violet-400"
                strokeWidth={1.25}
              />
            </div>
            <div
              className="
              flex items-center gap-2
              bg-[#3B1892]/20 border border-[#3B1892]/30
              px-4 py-1.5 rounded-full
            "
            >
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              <span className="text-xs font-bold tracking-widest text-violet-400 uppercase">
                Error 404
              </span>
            </div>
          </div>
        </div>

        {/* Heading */}
        <div className={`flex flex-col gap-3 -mt-4 ${fadeUp("delay-[200ms]")}`}>
          <h1
            className="text-3xl sm:text-4xl font-black text-white leading-tight tracking-tight"
            style={{ fontWeight: 800 }}
          >
            Lost in the{" "}
            <span
              className="text-transparent bg-clip-text
                             bg-gradient-to-r from-violet-400 to-blue-400"
            >
              learning universe?
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-md mx-auto">
            The page you're looking for took a different path. Don't worry —
            your next course is just one click away.
          </p>
        </div>

        {/* Search bar */}
        <div className={`w-full max-w-md ${fadeUp("delay-[300ms]")}`}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (query.trim()) {
                window.location.href = `/courses?search=${encodeURIComponent(query.trim())}`;
              }
            }}
            className="relative"
          >
            <Search
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for a course…"
              className="
                w-full pl-11 pr-32 py-3.5 rounded-2xl
                bg-white/6 border border-white/10
                text-white text-sm placeholder:text-slate-500
                focus:outline-none focus:ring-2 focus:ring-[#3B1892]/60
                focus:border-[#3B1892]/60 focus:bg-white/8
                transition-all duration-200
              "
            />
            <button
              type="submit"
              className="
                absolute right-2 top-1/2 -translate-y-1/2
                px-4 py-2 rounded-xl
                bg-gradient-to-r from-[#3B1892] to-violet-600
                text-white text-xs font-bold
                hover:shadow-[0_4px_16px_rgba(91,33,182,0.5)]
                hover:-translate-y-[calc(50%+1px)]
                active:scale-95
                transition-all duration-200
                whitespace-nowrap
              "
            >
              Search
            </button>
          </form>
        </div>

        {/* Quick links */}
        <div
          className={`flex flex-col sm:flex-row items-center gap-3 w-full max-w-md ${fadeUp("delay-[400ms]")}`}
        >
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="
                flex-1 w-full sm:w-auto
                flex items-center justify-center gap-2
                px-4 py-3 rounded-2xl
                bg-white/5 border border-white/8
                text-slate-300 text-sm font-semibold
                hover:bg-[#3B1892]/20 hover:border-[#3B1892]/40
                hover:text-white hover:-translate-y-0.5
                transition-all duration-200
              "
            >
              <span className="text-violet-400">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </div>

        {/* Go back */}
        <div className={fadeUp("delay-[500ms]")}>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="
              flex items-center gap-2 text-sm text-slate-500
              hover:text-slate-300 transition-colors duration-200
              group
            "
          >
            <ArrowLeft
              size={15}
              className="group-hover:-translate-x-1 transition-transform duration-200"
            />
            Go back to previous page
          </button>
        </div>
      </div>

      {/* ── bottom divider ── */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px
                      bg-gradient-to-r from-transparent via-[#3B1892]/30 to-transparent"
      />
    </main>
  );
}
