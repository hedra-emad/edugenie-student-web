"use client";
// src/app/(main)/checkout/failed/page.tsx

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function FailedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <div className="w-full max-w-md text-center">
      {/* X icon */}
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
      </div>

      {/* Heading */}
      <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
        Payment Failed
      </h1>
      <p className="text-slate-600 text-[13.5px] leading-relaxed mb-2">
        Your payment could not be processed. No charges have been made.
      </p>
      {orderId && (
        <p className="text-[12px] text-slate-400 font-mono mb-8">
          Reference: {orderId}
        </p>
      )}
      {!orderId && <div className="mb-8" />}

      {/* Details card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6 text-left">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
          Common reasons
        </p>
        <ul className="flex flex-col gap-2.5">
          {[
            "Insufficient funds or credit limit reached",
            "Card details entered incorrectly",
            "Transaction declined by your bank",
            "Network timeout during payment",
          ].map((reason) => (
            <li key={reason} className="flex items-start gap-2.5">
              <svg
                className="w-4 h-4 text-slate-300 mt-0.5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-[12.5px] text-slate-600 leading-snug">
                {reason}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => router.back()}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-[14px] font-bold text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
          style={{ backgroundColor: "#3B1892" }}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Try Again
        </button>
        <Link
          href="/courses"
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-[14px] font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors duration-150 active:scale-[0.98]"
        >
          Go to Courses
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutFailedPage() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center py-16 px-4">
      <Suspense
        fallback={
          <div className="w-full max-w-md text-center">
            <div className="animate-pulse h-16 w-16 rounded-full bg-slate-100 mx-auto mb-6" />
            <div className="animate-pulse h-7 w-40 bg-slate-100 rounded mx-auto mb-3" />
            <div className="animate-pulse h-4 w-64 bg-slate-100 rounded mx-auto" />
          </div>
        }
      >
        <FailedContent />
      </Suspense>
    </main>
  );
}