"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

// No props — pure presentational component
export default function CartEmptyState() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      {/* Shopping cart SVG icon — non-text graphic element (Req 4.1) */}
      <div className="flex justify-center mb-6">
        <svg
          className="w-20 h-20 text-slate-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 5h12M9 21a1 1 0 100-2 1 1 0 000 2zm10 0a1 1 0 100-2 1 1 0 000 2z"
          />
        </svg>
      </div>

      {/* "Your cart is empty" text (Req 4.1) */}
      <p className="text-slate-500 text-lg font-medium mb-2">Your cart is empty</p>
      <p className="text-slate-400 text-sm mb-8">
        Looks like you haven&apos;t added any courses yet.
      </p>

      {/* "Browse Courses" CTA — Link href="/courses" + router.push on click (Req 4.1, 4.2) */}
      <Link
        href="/courses"
        onClick={() => router.push("/courses")}
        className="inline-flex items-center gap-2 text-sm font-bold text-white px-6 py-3 rounded-xl transition-colors duration-150 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3B1892]"
        style={{ backgroundColor: "#3B1892" }}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
          />
        </svg>
        Browse Courses
      </Link>
    </div>
  );
}
