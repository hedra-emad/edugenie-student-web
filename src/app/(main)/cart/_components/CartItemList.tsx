"use client";
// src/app/(main)/cart/_components/CartItemList.tsx

import Image from "next/image";
import { useState } from "react";
import type { CartItem } from "@/types/checkout";
import ConfirmRemoveModal from "./ConfirmRemoveModal";
import Button from "@/components/ui/Button";

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
  const [failed, setFailed] = useState(false);

  return (
    <div className="relative w-20 h-14 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100">
      {safeSrc && !failed ? (
        <Image
          src={safeSrc}
          alt={alt}
          fill
          sizes="80px"
          className="object-cover"
          onError={() => setFailed(true)}
        />
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

// (Remove buttons use <Button loading> — the shared spinner, not DotsLoader)


// ─── Trash icon ───────────────────────────────────────────────────────────────

function TrashIcon({ size = "w-4 h-4" }: { size?: string }) {
  return (
    <svg
      className={size}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

// ─── types ────────────────────────────────────────────────────────────────────

interface CartItemListProps {
  groupedItems: Map<string, CartItem[]>;
  orderedCourseIds: string[];
  removingIds: Set<string>;
  errorIds: Map<string, string>; // removeId → error message
  onRequestRemove: (removeId: string) => void;
  onDismissError: (removeId: string) => void;
  getRemoveId: (item: CartItem) => string;
}

// ─── component ────────────────────────────────────────────────────────────────

export default function CartItemList({
  groupedItems,
  orderedCourseIds,
  removingIds,
  errorIds,
  onRequestRemove,
  onDismissError,
  getRemoveId,
}: CartItemListProps) {
  // tracks which single item has the confirm modal open
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  function handleRemoveClick(id: string) {
    setConfirmingId(id);
  }

  function handleConfirm(id: string) {
    onRequestRemove(id);
    setConfirmingId(null);
  }

  function handleCancel() {
    setConfirmingId(null);
  }

  if (orderedCourseIds.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {orderedCourseIds.map((courseId) => {
        const groupItems = groupedItems.get(courseId) ?? [];
        const first = groupItems[0];
        const isFullCourse = groupItems.every((i) => i.type === "full_course");

        // ── full_course card ─────────────────────────────────────────────────
        if (isFullCourse) {
          const item = first;
          const removeId = getRemoveId(item);
          const isRemoving = removingIds.has(removeId);
          const isConfirming = confirmingId === removeId;
          const errorMessage = errorIds.get(removeId);

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
                <p className="text-[12px] text-slate-400 mt-0.5">
                  {item.instructorName}
                </p>
                <span className="inline-block mt-1.5 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-violet-50 text-[#3B1892]">
                  FULL COURSE
                </span>

                {/* Inline error message */}
                {errorMessage && (
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <p className="text-[12px] text-red-500">{errorMessage}</p>
                    <button
                      onClick={() => onDismissError(removeId)}
                      aria-label="Dismiss error"
                      className="text-[12px] text-red-400 hover:text-red-600 transition-colors font-bold leading-none"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <span className="text-[15px] font-extrabold text-slate-900">
                  ${item.price.toFixed(2)}
                </span>

                {isConfirming ? (
                  <ConfirmRemoveModal
                    itemTitle={item.courseTitle}
                    onConfirm={() => handleConfirm(removeId)}
                    onCancel={handleCancel}
                  />
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveClick(removeId)}
                    disabled={isRemoving}
                    loading={isRemoving}
                    aria-label={`Remove ${item.courseTitle}`}
                  >
                    <TrashIcon />
                  </Button>
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
                const removeId = getRemoveId(section);
                const isRemoving = removingIds.has(removeId);
                const isConfirming = confirmingId === removeId;
                const errorMessage = errorIds.get(removeId);

                return (
                  <div
                    key={section.sectionId || section._id}
                    className="flex flex-col border-t border-slate-100 first:border-t-0 pt-1.5 first:pt-0"
                  >
                    <div className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {/* dot */}
                        <span className="w-1 h-1 rounded-full bg-slate-300 flex-shrink-0" />
                        <span className="text-[12.5px] text-slate-600 line-clamp-1">
                          {section.sectionTitle ?? "Section"}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                        <span className="text-[12.5px] font-semibold text-slate-800">
                          ${section.price.toFixed(2)}
                        </span>

                        {isConfirming ? (
                          <ConfirmRemoveModal
                            itemTitle={
                              section.sectionTitle ?? "Section"
                            }
                            onConfirm={() => handleConfirm(removeId)}
                            onCancel={handleCancel}
                          />
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveClick(removeId)}
                            disabled={isRemoving}
                            loading={isRemoving}
                            aria-label={`Remove ${section.sectionTitle ?? "Section"}`}
                          >
                            <TrashIcon size="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Inline error message for section */}
                    {errorMessage && (
                      <div className="flex items-center gap-1.5 pl-3 pb-1">
                        <p className="text-[12px] text-red-500">
                          {errorMessage}
                        </p>
                        <button
                          onClick={() => onDismissError(removeId)}
                          aria-label="Dismiss error"
                          className="text-[12px] text-red-400 hover:text-red-600 transition-colors font-bold leading-none"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end mt-2 pt-2 border-t border-slate-100">
              <span className="text-[13px] font-extrabold text-slate-900">
                ${groupTotal.toFixed(2)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
