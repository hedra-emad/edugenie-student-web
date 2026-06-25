"use client";
// src/app/(main)/cart/_components/CartOrderSummary.tsx

import { useState } from "react";
import type { CartItem } from "@/types/checkout";

// ─── types ────────────────────────────────────────────────────────────────────

export type CouponState =
  | { status: "hidden" }
  | { status: "open"; code: string; validating: boolean }
  | { status: "applied"; code: string; discountAmount: number }
  | { status: "error"; code: string; message: string; kind: "invalid" | "network" };

interface CartOrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  total: number;
  couponState: CouponState;
  onApplyCoupon: (code: string) => Promise<void>;
  onRemoveCoupon: () => void;
  onCheckout: () => void;
}

// ─── component ────────────────────────────────────────────────────────────────

export default function CartOrderSummary({
  items,
  subtotal,
  total,
  couponState,
  onApplyCoupon,
  onRemoveCoupon,
  onCheckout,
}: CartOrderSummaryProps) {
  const isEmpty = items.length === 0;

  // Local state for the coupon text input value
  const [inputCode, setInputCode] = useState("");
  // Local state: when status is "hidden", track whether the user clicked the toggle
  const [couponVisible, setCouponVisible] = useState(false);
  // Local validation message when Apply is clicked with an empty input
  const [localValidationMsg, setLocalValidationMsg] = useState<string | null>(null);

  // Reset local visibility whenever the parent hides the coupon section
  // (e.g. after remove coupon the parent sets status back to "hidden")
  // We don't need a useEffect for this — we derive from couponState below.

  // ── group section items by course ────────────────────────────────────────────

  const fullCourseItems = items.filter((i) => i.type === "full_course");
  const sectionItems = items.filter((i) => i.type === "section");

  const sectionGroups = sectionItems.reduce(
    (acc, item) => {
      if (!acc[item.courseId]) acc[item.courseId] = [];
      acc[item.courseId].push(item);
      return acc;
    },
    {} as Record<string, CartItem[]>,
  );

  // ── coupon section helpers ────────────────────────────────────────────────────

  // Determine whether the coupon input row should be visible
  const showCouponInput =
    couponVisible ||
    couponState.status === "open" ||
    couponState.status === "error";

  function handleApplyClick() {
    const trimmed = inputCode.trim();
    if (trimmed.length === 0) {
      setLocalValidationMsg("Please enter a coupon code");
      return;
    }
    setLocalValidationMsg(null);
    onApplyCoupon(trimmed);
  }

  function handleToggleCoupon() {
    setCouponVisible(true);
    setLocalValidationMsg(null);
    setInputCode("");
  }

  function handleRemoveCoupon() {
    setCouponVisible(false);
    setLocalValidationMsg(null);
    setInputCode("");
    onRemoveCoupon();
  }

  // ── derive error message to display under input ───────────────────────────────

  const couponErrorMsg =
    couponState.status === "error"
      ? couponState.message
      : localValidationMsg;

  // ── render ───────────────────────────────────────────────────────────────────

  return (
    <div className="lg:sticky lg:top-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        {/* Header */}
        <p className="text-[15px] font-bold text-slate-900 mb-4">
          Order Summary
        </p>

        {/* Items section */}
        {items.length === 0 ? (
          <p className="text-[13px] text-slate-400 text-center py-2 mb-4">
            No items in cart
          </p>
        ) : (
          <div className="flex flex-col gap-2 mb-2">
            {/* Full course rows */}
            {fullCourseItems.map((item) => (
              <div key={item._id}>
                <div className="flex items-start justify-between gap-3 py-1">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-slate-700 line-clamp-1">
                      {item.courseTitle}
                    </p>
                    <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-violet-50 text-[#3B1892]">
                      Full Course
                    </span>
                  </div>
                  <span className="text-[13px] font-semibold text-slate-900 flex-shrink-0">
                    ${item.price}
                  </span>
                </div>
              </div>
            ))}

            {/* Section groups */}
            {Object.entries(sectionGroups).map(([courseId, sections]) => (
              <div key={courseId} className="mt-1">
                {/* Course group header */}
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide border-b border-slate-100 pb-1 mb-1">
                  {sections[0].courseTitle}
                </p>
                {/* Section rows */}
                {sections.map((section) => (
                  <div
                    key={section.sectionId ?? section._id}
                    className="flex items-center justify-between pl-3 py-1"
                  >
                    <span className="text-[12px] text-slate-600 line-clamp-1 flex-1">
                      — {section.sectionTitle ?? section.courseTitle}
                    </span>
                    <span className="text-[12px] font-semibold text-slate-700 flex-shrink-0 ml-3">
                      ${section.price}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-slate-200 my-3" />

        {/* Subtotal — always shown when items present */}
        {items.length > 0 && (
          <div className="flex justify-between items-center mb-2">
            <span className="text-[13px] text-slate-500">Subtotal</span>
            <span className="text-[13px] font-semibold text-slate-700">
              ${subtotal}
            </span>
          </div>
        )}

        {/* Coupon section */}
        <div className="mb-2">
          {/* "Have a coupon?" toggle — shown only when status is "hidden" and not yet toggled open */}
          {couponState.status === "hidden" && !couponVisible && (
            <button
              onClick={handleToggleCoupon}
              className="min-h-[44px] px-1 text-[12px] font-semibold cursor-pointer"
              style={{ color: "#3B1892" }}
            >
              Have a coupon?
            </button>
          )}

          {/* Coupon input — shown when open, error, or locally toggled */}
          {couponState.status !== "applied" && showCouponInput && (
            <div className="mt-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => {
                    setInputCode(e.target.value.toUpperCase());
                    setLocalValidationMsg(null);
                  }}
                  placeholder="Enter coupon code"
                  className="flex-1 text-[13px] border border-slate-200 rounded-xl px-3 py-2.5 min-h-[44px] outline-none uppercase tracking-widest focus:border-[#3B1892] transition-colors"
                  aria-label="Coupon code"
                />
                <button
                  onClick={handleApplyClick}
                  disabled={couponState.status === "open" && couponState.validating}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[12px] font-bold px-4 min-h-[44px] rounded-xl transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {couponState.status === "open" && couponState.validating
                    ? "Applying…"
                    : "Apply"}
                </button>
              </div>
              {/* Error / validation message below input */}
              {couponErrorMsg && (
                <p className="text-red-500 text-[11px] mt-1" role="alert">
                  {couponErrorMsg}
                </p>
              )}
            </div>
          )}

          {/* Applied state — show green chip + Remove button */}
          {couponState.status === "applied" && (
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-[12px] font-semibold text-emerald-600">
                Coupon &ldquo;{couponState.code}&rdquo; applied
              </span>
              <button
                onClick={handleRemoveCoupon}
                className="min-h-[44px] px-1 text-[12px] font-semibold text-red-500 hover:text-red-700 transition-colors duration-150"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        {/* Discount row — shown only when coupon applied and discountAmount > 0 */}
        {couponState.status === "applied" && couponState.discountAmount > 0 && (
          <div className="flex justify-between items-center mb-2 text-emerald-600">
            <span className="text-[12px] font-semibold">Discount</span>
            <span className="text-[12px] font-bold">
              -${couponState.discountAmount.toFixed(2)}
            </span>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-slate-200 my-3" />

        {/* Total — always shown */}
        <div className="flex justify-between items-center">
          <span className="text-[15px] font-extrabold text-slate-900">
            Total
          </span>
          <span
            className="text-[19px] font-extrabold"
            style={{ color: "#3B1892" }}
          >
            ${total.toFixed(2)}
          </span>
        </div>

        {/* Payment methods section */}
        <div className="mt-3">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
            Accepted Payment Methods
          </p>
          <div className="grid grid-cols-2 gap-2">
            {/* Badge 1 — Credit/Debit Card */}
            <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <svg
                className="w-4 h-4 text-slate-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
              <span className="text-[12px] font-semibold text-slate-600">
                Credit / Debit Card
              </span>
            </div>

            {/* Badge 2 — Mobile Wallet */}
            <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <svg
                className="w-4 h-4 text-slate-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <rect x="3" y="6" width="18" height="12" rx="2" />
                <circle cx="16" cy="12" r="1" />
              </svg>
              <span className="text-[12px] font-semibold text-slate-600">
                Mobile Wallet
              </span>
            </div>

            {/* Badge 3 — Vodafone Cash */}
            <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <svg
                className="w-4 h-4 text-red-500"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" />
              </svg>
              <span className="text-[12px] font-semibold text-slate-600">
                Vodafone Cash
              </span>
            </div>

            {/* Badge 4 — Instapay */}
            <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <svg
                className="w-4 h-4 text-violet-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path d="M5 12h14" />
                <path d="M12 5l7 7-7 7" />
              </svg>
              <span className="text-[12px] font-semibold text-slate-600">
                Instapay
              </span>
            </div>
          </div>
        </div>

        {/* Proceed to Checkout button */}
        <button
          onClick={onCheckout}
          disabled={isEmpty}
          className={`w-full mt-4 py-3.5 rounded-xl text-[14px] font-bold transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#3B1892] min-h-[44px] ${
            isEmpty
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : "text-white hover:bg-violet-800"
          }`}
          style={isEmpty ? undefined : { backgroundColor: "#3B1892" }}
        >
          {`Proceed to Checkout — $${total.toFixed(2)}`}
        </button>

        {/* Security note */}
        <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <svg
            className="w-3.5 h-3.5 text-slate-400 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          Secured by Paymob · 256-bit SSL
        </div>
      </div>
    </div>
  );
}
