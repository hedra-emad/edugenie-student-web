"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface ToastProps {
  message?: string;
  onDismiss?: () => void;
}

export default function Toast({
  message = "Added to your cart",
  onDismiss,
}: ToastProps) {
  const [visible, setVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    const showTimer = requestAnimationFrame(() => setVisible(true));

    const dismissTimer = setTimeout(() => {
      setFadingOut(true);
      setTimeout(() => onDismiss?.(), 200);
    }, 3000);

    return () => {
      cancelAnimationFrame(showTimer);
      clearTimeout(dismissTimer);
    };
  }, [onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`
        fixed z-50
        top-4 left-4 right-4
        sm:top-auto sm:left-auto sm:right-6 sm:bottom-6
        bg-white border border-gray-100 rounded-xl shadow-sm
        px-4 py-3
        transition-opacity duration-200
        ${visible && !fadingOut ? "opacity-100" : "opacity-0"}
      `}
      style={{ padding: "12px 16px" }}
    >
      <div className="flex items-center gap-3">
        <svg
          className="w-4 h-4 text-emerald-600 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-sm text-slate-800">{message}</span>
        <Link
          href="/cart"
          className="text-[#3B1892] text-sm font-semibold whitespace-nowrap hover:opacity-80 transition-opacity"
        >
          View cart →
        </Link>
      </div>
    </div>
  );
}
