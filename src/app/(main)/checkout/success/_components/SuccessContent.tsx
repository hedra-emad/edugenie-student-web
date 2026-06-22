"use client";
// src/app/(main)/checkout/success/_components/SuccessContent.tsx

import Link from "next/link";
import type { Order } from "@/types/checkout";

interface SuccessContentProps {
  order: Order;
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function SuccessContent({ order }: SuccessContentProps) {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-lg">
        {/* Checkmark icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-emerald-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
            Payment Successful!
          </h1>
          <p className="text-slate-600 text-[13.5px] leading-relaxed">
            You now have access to your purchased content.
          </p>
        </div>

        {/* Order details card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6">
          <p className="text-[13px] font-bold text-slate-900 mb-3">
            Order #{order.orderId.slice(-8)}
          </p>

          {/* Items */}
          <div className="flex flex-col gap-2.5 mb-4">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-slate-800 line-clamp-1">
                    {item.courseTitle}
                  </p>
                  {item.sectionTitle && (
                    <p className="text-[11.5px] text-slate-400 mt-0.5">
                      {item.sectionTitle}
                    </p>
                  )}
                  <span
                    className={`inline-block mt-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                      item.type === "full_course"
                        ? "bg-violet-50 text-[#3B1892]"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {item.type === "full_course" ? "Full Course" : "Section"}
                  </span>
                </div>
                <span className="text-[13px] font-bold text-slate-800 flex-shrink-0">
                  ${item.price}
                </span>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-slate-100 my-3" />

          {/* Total */}
          <div className="flex items-center justify-between">
            <span className="text-[13.5px] font-extrabold text-slate-900">Total paid</span>
            <span className="text-[18px] font-extrabold" style={{ color: "#3B1892" }}>
              ${order.total}
            </span>
          </div>

          {/* Paid at */}
          {order.paidAt && (
            <p className="text-[11px] text-slate-400 mt-3">
              Paid on {formatDate(order.paidAt)}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/courses"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[14px] font-bold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#3B1892" }}
          >
            Go to My Courses
          </Link>
          <Link
            href="/courses"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[14px] font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors duration-150"
          >
            Browse More Courses
          </Link>
        </div>
      </div>
    </main>
  );
}
