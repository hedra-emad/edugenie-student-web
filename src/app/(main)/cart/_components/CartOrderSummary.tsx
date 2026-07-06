"use client";
// src/app/(main)/cart/_components/CartOrderSummary.tsx

import type { CartItem } from "@/types/checkout";
import Button from "@/components/ui/Button";

interface CartOrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  total: number;
  onCheckout: () => void;
  loading?: boolean;
}

export default function CartOrderSummary({
  items,
  subtotal,
  total,
  onCheckout,
  loading = false,
}: CartOrderSummaryProps) {
  const isEmpty = items.length === 0;
  const itemCount = items.length;

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

  return (
    <div className="lg:sticky lg:top-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <p className="text-[15px] font-bold text-slate-900 mb-1">
          Order Summary
        </p>
        {itemCount > 0 && (
          <p className="text-[12px] text-slate-400 mb-4">
            {itemCount} item{itemCount === 1 ? "" : "s"}
          </p>
        )}

        {items.length === 0 ? (
          <p className="text-[13px] text-slate-400 text-center py-2 mb-4">
            No items in cart
          </p>
        ) : (
          <div className="flex flex-col gap-2 mb-2">
            {fullCourseItems.map((item) => (
              <div key={item._id}>
                <div className="flex items-start justify-between gap-3 py-1">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-slate-700 line-clamp-1">
                      {item.courseTitle}
                    </p>
                    <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-violet-50 text-[#3B1892]">
                      FULL COURSE
                    </span>
                  </div>
                  <span className="text-[13px] font-semibold text-slate-900 flex-shrink-0">
                    ${item.price.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}

            {Object.entries(sectionGroups).map(([courseId, sections]) => (
              <div key={courseId} className="mt-1">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide border-b border-slate-100 pb-1 mb-1">
                  {sections[0].courseTitle}
                </p>
                {sections.map((section) => (
                  <div
                    key={section.sectionId ?? section._id}
                    className="flex items-center justify-between pl-3 py-1"
                  >
                    <span className="text-[12px] text-slate-600 line-clamp-1 flex-1">
                      — {section.sectionTitle ?? "Section"}
                    </span>
                    <span className="text-[12px] font-semibold text-slate-700 flex-shrink-0 ml-3">
                      ${section.price.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-slate-200 my-3" />

        {items.length > 0 && (
          <div className="flex justify-between items-center mb-2">
            <span className="text-[13px] text-slate-500">Subtotal</span>
            <span className="text-[13px] font-semibold text-slate-700">
              ${subtotal.toFixed(2)}
            </span>
          </div>
        )}

        <div className="border-t border-slate-200 my-3" />

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

        <Button
          onClick={onCheckout}
          disabled={isEmpty}
          loading={loading}
          fullWidth
          className="mt-4"
        >
          {`Proceed to Checkout — $${total.toFixed(2)}`}
        </Button>
      </div>
    </div>
  );
}
