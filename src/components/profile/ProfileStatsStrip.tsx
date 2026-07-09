"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { UserProfile } from "@/types/profile.types";

interface StatItem {
  value: number | string;
  label: string;
  isNumeric: boolean;
}

function formatMemberSince(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function useCountUp(target: number, duration = 800): number {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (target === 0) {
      setCount(0);
      return;
    }

    function tick(timestamp: number) {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setCount(target);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return count;
}

function StatCell({ stat }: { stat: StatItem }) {
  const numericVal = stat.isNumeric ? (stat.value as number) : 0;
  const count = useCountUp(numericVal);

  return (
    <div
      className="flex-1 flex flex-col items-center justify-center py-4 px-3 text-center"
    >
      <span className="text-2xl font-bold text-slate-900 tabular-nums">
        {stat.isNumeric ? count : (stat.value as string)}
      </span>
      <span className="text-xs text-slate-500 mt-0.5">{stat.label}</span>
    </div>
  );
}

interface Props {
  profile: UserProfile;
  /** Number of enrolled courses — from `useEnrollments()`. */
  enrolledCount?: number;
  /**
   * Certificates count. Required, and must be derived from the same
   * `useCertificates()` query the Certificates tab renders — a default here
   * once silently showed "0 Certificates" next to a populated list.
   */
  certCount: number;
}

export default function ProfileStatsStrip({
  profile,
  enrolledCount = 0,
  certCount,
}: Props) {
  const stats: StatItem[] = [
    { value: enrolledCount, label: "Courses Enrolled", isNumeric: true },
    { value: certCount, label: "Certificates", isNumeric: true },
    {
      value: formatMemberSince(profile.createdAt),
      label: "Member Since",
      isNumeric: false,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white"
      role="list"
      aria-label="Profile statistics"
    >
      <div className="max-w-5xl mx-auto flex divide-x-0">
        {stats.map((stat) => (
          <StatCell key={stat.label} stat={stat} />
        ))}
      </div>
    </motion.div>
  );
}
