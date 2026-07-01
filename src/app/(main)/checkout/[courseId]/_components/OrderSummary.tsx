"use client";
// src/app/(main)/checkout/[courseId]/_components/OrderSummary.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import DotsLoader from "@/components/ui/DotsLoader";
import type { CartItem } from "@/types/checkout";
import Image from "next/image";

// ─── types ────────────────────────────────────────────────────────────────────

export type ButtonStep = "idle" | "loading" | "redirect";

interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  total: number;
  buttonStep: ButtonStep;
  onConfirm: () => void;
}

// ─── component ────────────────────────────────────────────────────────────────

export default function OrderSummary({
  items,
  subtotal,
  total,
  buttonStep,
  onConfirm,
}: OrderSummaryProps) {
  const router = useRouter();
  const isEmpty = items.length === 0;
  const isDisabled = isEmpty || buttonStep !== "idle";

  // ── coupon state (UI-only — TODO: wire to real API) ──────────────────────────
  const [couponOpen, setCouponOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponStatus, setCouponStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [discountAmount] = useState(0); // TODO: set from API response

  function handleApplyCoupon() {
    // TODO: call coupon validation API here
    if (couponCode.trim().length === 0) return;
    // Simulate UI feedback — replace with real API call
    if (couponCode.toUpperCase() === "DEMO10") {
      setCouponStatus("success");
    } else {
      setCouponStatus("error");
    }
  }

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

  // ── button label ─────────────────────────────────────────────────────────────

  function renderButtonContent() {
    if (buttonStep === "loading") {
      return <DotsLoader />;
    }
    if (buttonStep === "redirect") {
      return (
        <span className="flex items-center justify-center gap-2">
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
          Redirecting to Paymob...
        </span>
      );
    }
    return `Confirm & Pay — EGP${total.toFixed(2)}`;
  }

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
                    EGP{item.price}
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
                      EGP{section.price}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-slate-200 my-3" />

        {/* Subtotal */}
        <div className="flex justify-between items-center mb-2">
          <span className="text-[13px] text-slate-500">Subtotal</span>
          <span className="text-[13px] font-semibold text-slate-700">
            EGP{subtotal.toFixed(2)}
          </span>
        </div>

        {/* Coupon row — UI only, TODO: wire to API */}
        <div className="mb-2">
          <button
            onClick={() => {
              setCouponOpen((v) => !v);
              setCouponStatus("idle");
              setCouponCode("");
            }}
            className="text-[12px] font-semibold cursor-pointer"
            style={{ color: "#3B1892" }}
          >
            Have a coupon?
          </button>

          {couponOpen && (
            <div className="mt-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value.toUpperCase());
                    setCouponStatus("idle");
                  }}
                  placeholder="Enter coupon code"
                  className="flex-1 text-[13px] border border-slate-200 rounded-xl px-3 py-2 outline-none uppercase tracking-widest focus:border-[#3B1892] transition-colors"
                />
                <button
                  onClick={handleApplyCoupon}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[12px] font-bold px-4 py-2 rounded-xl transition-colors duration-150"
                >
                  Apply
                </button>
              </div>
              {couponStatus === "success" && (
                <p className="text-emerald-600 text-[11px] mt-1">
                  Coupon applied!
                </p>
              )}
              {couponStatus === "error" && (
                <p className="text-red-500 text-[11px] mt-1">
                  Invalid coupon code
                </p>
              )}
            </div>
          )}
        </div>

        {/* Discount row — shown only if coupon applied */}
        {couponStatus === "success" && discountAmount > 0 && (
          <div className="flex justify-between items-center mb-2 text-emerald-600">
            <span className="text-[12px] font-semibold">Discount</span>
            <span className="text-[12px] font-bold">-EGP{discountAmount}</span>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-slate-200 my-3" />

        {/* Total */}
        <div className="flex justify-between items-center">
          <span className="text-[15px] font-extrabold text-slate-900">
            Total
          </span>
          <span
            className="text-[19px] font-extrabold"
            style={{ color: "#3B1892" }}
          >
            EGP{total.toFixed(2)}
          </span>
        </div>

        
        {/* Payment methods section */}
        <div className="mt-3">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
            Accepted Payment Methods
          </p>
          <div className="grid grid-cols-2 gap-2">
            {/* Badge 1 — Credit/Debit Card */}

            <div className="flex items-center justify-center px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <Image
                src="/card-mastercard.png"
                alt="Credit Card"
                width={110}
                height={28}
                className="h-6 w-auto object-contain"
              />
              <span className="text-[12px] font-semibold text-slate-600">
                Credit/DebitCard
              </span>
            </div>

            {/* Badge 2 — meeza */}
           
            
<div className="flex items-center justify-center px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <Image
                src="/meeza.png"
                alt="Meeza"
                width={110}
                height={28}
                className="h-6 w-auto object-contain"
              />
              <span className="text-[12px] font-semibold text-slate-600">
                Meeza
              </span>
            </div>

            {/* Badge 3 — Vodafone Cash */}
           
            <div className="flex items-center justify-center px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <Image
                src="/vc.png"
                alt="Vodafone Cash"
                width={110}
                height={28}
                className="h-6 w-auto object-contain"
              />
              <span className="text-[12px] font-semibold text-slate-600">
                Vodafone Cash
              </span>
            </div>

            {/* Badge 4 — Instapay */}

            <div className="flex items-center justify-center px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <Image
                src="/InstaPay_Logo.png"
                alt="Instapay"
                width={110}
                height={28}
                className="h-6 w-auto object-contain"
              />
              <span className="text-[12px] font-semibold text-slate-600">
                Instapay
              </span>
            </div>
          </div>   
        </div>

        {/* Confirm & Pay button */}
        <button
          onClick={onConfirm}
          disabled={isDisabled}
          className={`w-full mt-4 py-3.5 rounded-xl text-[14px] font-bold transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#3B1892] ${
            isDisabled
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : "text-white hover:bg-violet-800"
          }`}
          style={isDisabled ? undefined : { backgroundColor: "#3B1892" }}
        >
          {renderButtonContent()}
        </button>

        {/* Security note */}
        <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <svg
            className="w-3.5 h-3.5 text-slate-400 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          Secured by Paymob · 256-bit SSL
        </div>

        {/* Back button */}
        <div className="mt-2 flex items-center justify-center">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-[12px] text-slate-400 hover:text-slate-600 transition-colors duration-150"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to course
          </button>
        </div>
      </div>
    </div>
  );
}
