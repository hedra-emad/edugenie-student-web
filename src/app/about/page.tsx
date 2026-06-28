"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
// ─── Team Data ────────────────────────────────────────────────────────────────

const TEAM = [
  {
    name: "Hedra Emad",
    initials: "HE",
    role: "Frontend Developer",
    gradient: "from-sky-500 to-cyan-400",
    image: "/Hedra Emad.jpg",
    github: "https://github.com",
    linkedin: "https://linkedin.com",
  },
  {
    name: "Aliaa Mohammed",
    initials: "AM",
    role: "Frontend Developer",
    gradient: "from-amber-500 to-yellow-400",
    image: "/Aliaa Mohammed.jpg",
    github: "https://github.com",
    linkedin: "https://linkedin.com",
  },
  {
    name: "Fatma Mohamed",
    initials: "FM",
    role: "UI/UX & Frontend",
    gradient: "from-pink-500 to-rose-400",
    image: "/Fatma Mohamed.png",
    github: "https://github.com",
    linkedin: "https://linkedin.com",
  },
  {
    name: "Nada Mahmoud",
    initials: "NM",
    role: "Backend Developer",
    gradient: "from-emerald-500 to-teal-400",
    image: "/Nada Mahmoud.jpg",
    github: "https://github.com",
    linkedin: "https://linkedin.com",
  },
  {
    name: "Kareem Mohamed",
    initials: "KM",
    role: "Full-Stack Developer",
    gradient: "from-violet-600 to-blue-500",
    image: "/Kareem Mohamed.jpeg",
    github: "https://github.com",
    linkedin: "https://linkedin.com",
  },
];

const STATS = [
  { value: "5", label: "Developers" },
  { value: "ITI", label: "Graduate Project" },
  { value: "MEARN", label: "Graduation 2026" },
  { value: "1", label: "Big Dream" },
];

const STACK = [
  { name: "Next.js", color: "bg-slate-100 text-slate-700 border-slate-200" },
  { name: "NestJS", color: "bg-red-50 text-red-700 border-red-100" },
  { name: "TypeScript", color: "bg-blue-50 text-blue-700 border-blue-100" },
  {
    name: "MongoDB",
    color: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
  { name: "Tailwind CSS", color: "bg-cyan-50 text-cyan-700 border-cyan-100" },
  { name: "Angular", color: "bg-red-50 text-red-600 border-red-100" },
  {
    name: "Framer Motion",
    color: "bg-violet-50 text-violet-700 border-violet-100",
  },
  { name: "Cloudinary", color: "bg-blue-50 text-blue-600 border-blue-100" },
  { name: "Paymob", color: "bg-amber-50 text-amber-700 border-amber-100" },
  { name: "Vercel", color: "bg-slate-100 text-slate-700 border-slate-200" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: "easeOut" },
  }),
};

function GithubIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
    </svg>
  );
}

function LinkedinIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286ZM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065Zm1.782 13.019H3.555V9h3.564v11.452ZM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003Z" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function BrainIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
      <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
      <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
      <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
      <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
      <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
      <path d="M6 18a4 4 0 0 1-1.967-.516" />
      <path d="M19.967 17.484A4 4 0 0 1 18 18" />
    </svg>
  );
}

function RocketIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09Z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2Z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  );
}

export default function AboutPage() {
  return (
    <main className="bg-[#f8f7ff] min-h-screen">
      {/* HERO */}
      <section className="relative overflow-hidden bg-[#3B1892] pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="absolute top-0 right-0 w-[480px] h-[480px] rounded-full bg-[#5B3DB8] opacity-30 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[320px] h-[320px] rounded-full bg-violet-400 opacity-20 blur-[100px] pointer-events-none" />

        <div className="relative max-w-[860px] mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/80 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-6"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            ITI Graduation Project · 2026
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="text-4xl sm:text-5xl lg:text-[3.25rem] font-black text-white leading-tight tracking-tight mb-5"
          >
            We built EduGenie
            <br />
            <span className="text-violet-300">to make learning click.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.16 }}
            className="text-base sm:text-lg text-white/70 leading-relaxed max-w-[600px] mx-auto"
          >
            Five developers from ITI's MEARN track who turned a graduation
            requirement into something they are genuinely proud of.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.28 }}
          className="relative max-w-[700px] mx-auto mt-14 grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/10 rounded-2xl overflow-hidden border border-white/10"
        >
          {STATS.map((s) => (
            <div key={s.label} className="bg-[#3B1892] px-6 py-5 text-center">
              <p className="text-2xl font-black text-white tracking-tight">
                {s.value}
              </p>
              <p className="text-xs text-white/50 mt-0.5 font-medium">
                {s.label}
              </p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* MISSION CARDS */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1100px] mx-auto grid lg:grid-cols-3 gap-6">
          {[
            {
              icon: <BookIcon />,
              title: "Learn at your pace",
              body: "Structured courses built around real outcomes — not filler content. Every lesson earns its place.",
            },
            {
              icon: <BrainIcon />,
              title: "AI-powered support",
              body: "An AI assistant inside every course to answer questions, clarify concepts, and keep you unblocked.",
            },
            {
              icon: <RocketIcon />,
              title: "Built for the real world",
              body: "Practical projects, instructor feedback, and certificates that signal real skill — not just completion.",
            },
          ].map((card, i) => (
            <motion.div
              key={card.title}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={fadeUp}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-7 flex flex-col gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-[#3B1892]">
                {card.icon}
              </div>
              <h3 className="text-base font-bold text-slate-900">
                {card.title}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                {card.body}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* TEAM */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-bold tracking-widest text-[#3B1892] uppercase">
              The People Behind It
            </span>
            <h2 className="text-3xl font-black text-slate-900 mt-2 mb-3">
              Meet the team
            </h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Five developers from ITI who turned a graduation requirement into
              something they are genuinely proud of.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {TEAM.map((member, i) => (
              <motion.div
                key={member.name}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={fadeUp}
                whileHover={{
                  y: -4,
                  boxShadow: "0 20px 40px rgba(59,24,146,0.12)",
                }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col items-center text-center gap-4"
              >
                {member.image ? (
                  <Image
                    src={member.image}
                    alt={member.name}
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-full object-cover object-top shadow-md"
                  />
                ) : (
                  <div
                    className={`w-16 h-16 rounded-full bg-gradient-to-br ${member.gradient} flex items-center justify-center text-white font-black text-lg shadow-md`}
                  >
                    {member.initials}
                  </div>
                )}
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {member.name}
                  </h3>
                  <p className="text-xs text-[#3B1892] font-semibold mt-0.5">
                    {member.role}
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-auto">
                  <a
                    href={member.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${member.name} GitHub`}
                    className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-colors duration-200"
                  >
                    <GithubIcon />
                  </a>
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${member.name} LinkedIn`}
                    className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#0A66C2] hover:border-blue-200 transition-colors duration-200"
                  >
                    <LinkedinIcon />
                  </a>
                </div>
              </motion.div>
            ))}

            {/* Accent filler card */}
            <motion.div
              custom={5}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={fadeUp}
              className="bg-[#3B1892] rounded-xl p-6 flex flex-col items-center justify-center text-center gap-3 sm:col-span-2 lg:col-span-1"
            >
              <p className="text-white/60 text-xs font-bold tracking-widest uppercase">
                Built with
              </p>
              <p className="text-white font-black text-2xl leading-tight">
                Passion
                <br />
                &amp; Code
              </p>
              <p className="text-white/50 text-xs max-w-[160px] leading-relaxed">
                From ITI classrooms to a real production platform.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* TECH STACK */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-100">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-bold tracking-widest text-[#3B1892] uppercase">
              Technology
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-2">
              What we built it with
            </h2>
          </div>
          <div className="flex flex-wrap justify-center gap-2.5">
            {STACK.map((tech, i) => (
              <motion.span
                key={tech.name}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className={`text-sm font-semibold px-4 py-2 rounded-xl border ${tech.color}`}
              >
                {tech.name}
              </motion.span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[640px] mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-black text-slate-900 mb-4">
              Ready to start learning?
            </h2>
            <p className="text-sm text-slate-500 mb-8 leading-relaxed">
              Browse our catalog and find your next course — built by
              instructors who care about the craft.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link
                href="/courses"
                className="bg-[#3B1892] hover:bg-[#5B3DB8] text-white font-bold px-7 py-3 rounded-xl text-sm transition-colors duration-200"
              >
                Browse Courses
              </Link>
              <Link
                href="/"
                className="border border-slate-200 hover:border-[#3B1892] hover:text-[#3B1892] text-slate-600 font-bold px-7 py-3 rounded-xl text-sm transition-colors duration-200"
              >
                Back to Home
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
