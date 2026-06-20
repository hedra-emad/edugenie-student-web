"use client";
// src/app/(main)/checkout/[courseId]/_components/CartSummary.tsx

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { removeFromCart } from "@/lib/api/checkout";
import type { CartItem } from "@/types/checkout";

// ─── helpers ──────────────────────────────────────────────────────────────────

function getSafeImageSrc(src: string): string | null {
  const trimmed = src.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("/")) return trimmed;
  if (!/^https?:\/\//i.test(trimmed)) return null;
  try {
    const { hostname } = new URL(trimmed);
    const allowed = [
      "res.cloudinary.com",
      "edugenie-api.vercel.app",
      "images.unsplash.com",
    ];
    return allowed.includes(hostname) ? trimmed : null;
  } catch {
    return null;
  }
}

function Thumbnail({ src, alt }: { src: string; alt: string }) {
  const safeSrc = getSafeImageSrc(src);
  return (
    <div className="relative w-20 h-14 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100">
      {safeSrc ? (
        <Image src={safeSrc} alt={alt} fill sizes="80px" className="object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <svg
            className="w-6 h-6 text-slate-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}
    </div>
  );
}

// ─── types ────────────────────────────────────────────────────────────────────

interface CartSummaryProps {
  items: CartItem[];
  onItemRemoved: (itemId: string) => void;
}

// ─── component ────────────────────────────────────────────────────────────────

export default function CartSummary({ items, onItemRemoved }: CartSummaryProps) {
  // Set of itemIds currently being removed (spinner shown)
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  // Set of itemIds where delete confirmation is showing
  const [confirmingIds, setConfirmingIds] = useState<Set<string>>(new Set());

  // ── remove helpers ──────────────────────────────────────────────────────────

  function requestConfirm(itemId: string) {
    setConfirmingIds((prev) => new Set(prev).add(itemId));
  }

  function cancelConfirm(itemId: string) {
    setConfirmingIds((prev) => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
  }

  async function confirmRemove(itemId: string) {
    setConfirmingIds((prev) => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
    if (removingIds.has(itemId)) return;
    setRemovingIds((prev) => new Set(prev).add(itemId));
    const ok = await removeFromCart(itemId);
    setRemovingIds((prev) => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
    if (ok) onItemRemoved(itemId);
  }

  // ── empty state ─────────────────────────────────────────────────────────────

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
        <div className="flex justify-center mb-4">
          <svg
            className="w-12 h-12 text-slate-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 5h12M9 21a1 1 0 100-2 1 1 0 000 2zm10 0a1 1 0 100-2 1 1 0 000 2z" />
          </svg>
        </div>
        <p className="text-slate-400 text-sm mb-4">Your cart is empty</p>
        <Link
          href="/courses"
          className="inline-flex items-center gap-1.5 text-[13px] font-bold text-white px-5 py-2.5 rounded-xl transition-colors duration-150"
          style={{ backgroundColor: "#3B1892" }}
        >
          Browse Courses
        </Link>
      </div>
    );
  }

  // ── group items ─────────────────────────────────────────────────────────────

  const grouped = items.reduce(
    (acc, item) => {
      const key = item.courseId;
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    },
    {} as Record<string, CartItem[]>,
  );

  // ── render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-3">
      {Object.entries(grouped).map(([courseId, groupItems]) => {
        const first = groupItems[0];
        const isFullCourse = first.type === "full_course";

        // ── full_course card ─────────────────────────────────────────────────
        if (isFullCourse) {
          const item = first;
          const isRemoving = removingIds.has(item._id);
          const isConfirming = confirmingIds.has(item._id);

          return (
            <div
              key={courseId}
              className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4"
            >
              <Thumbnail src={item.thumbnail} alt={item.courseTitle} />

              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-slate-900 line-clamp-1">
                  {item.courseTitle}
                </p>
                <p className="text-[12px] text-slate-400 mt-0.5">{item.instructorName}</p>
                <span className="inline-block mt-1.5 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-violet-50 text-[#3B1892]">
                  Full Course
                </span>
              </div>

              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <span className="text-[15px] font-extrabold text-slate-900">
                  ${item.price}
                </span>

                {isConfirming ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-slate-500">Remove?</span>
                    <button
                      onClick={() => cancelConfirm(item._id)}
                      className="text-[12px] font-semibold text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => confirmRemove(item._id)}
                      className="text-[12px] font-bold text-red-500 hover:text-red-700 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => requestConfirm(item._id)}
                    disabled={isRemoving}
                    aria-label={`Remove ${item.courseTitle}`}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors duration-150 disabled:opacity-40"
                  >
                    {isRemoving ? (
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        }

        // ── section group card ───────────────────────────────────────────────
        const groupTotal = groupItems.reduce((sum, i) => sum + i.price, 0);

        return (
          <div
            key={courseId}
            className="bg-white rounded-2xl border border-slate-200 p-4"
          >
            {/* Card header: thumbnail + course title */}
            <div className="flex items-center gap-3 mb-3">
              <Thumbnail src={first.thumbnail} alt={first.courseTitle} />
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-slate-900 line-clamp-1">
                  {first.courseTitle}
                </p>
                <p className="text-[12px] text-slate-400 mt-0.5">
                  {first.instructorName}
                </p>
              </div>
            </div>

            {/* Section rows */}
            <div className="flex flex-col gap-1 pl-1">
              {groupItems.map((section) => {
                const isRemoving = removingIds.has(section._id);
                const isConfirming = confirmingIds.has(section._id);

                return (
                  <div
                    key={section.sectionId ?? section._id}
                    className="flex items-center justify-between py-1.5 border-t border-slate-100 first:border-t-0"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {/* dot */}
                      <span className="w-1 h-1 rounded-full bg-slate-300 flex-shrink-0" />
                      <span className="text-[12.5px] text-slate-600 line-clamp-1">
                        {section.sectionTitle ?? section.courseTitle}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                      <span className="text-[12.5px] font-semibold text-slate-800">
                        ${section.price}
                      </span>

                      {isConfirming ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[12px] text-slate-500">Remove?</span>
                          <button
                            onClick={() => cancelConfirm(section._id)}
                            className="text-[12px] font-semibold text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => confirmRemove(section._id)}
                            className="text-[12px] font-bold text-red-500 hover:text-red-700 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => requestConfirm(section._id)}
                          disabled={isRemoving}
                          aria-label={`Remove ${section.sectionTitle ?? section.courseTitle}`}
                          className="w-6 h-6 rounded-md flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors duration-150 disabled:opacity-40"
                        >
                          {isRemoving ? (
                            <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Group total */}
            <div className="flex justify-end mt-2 pt-2 border-t border-slate-100">
              <span className="text-[13px] font-extrabold text-slate-900">
                ${groupTotal}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
