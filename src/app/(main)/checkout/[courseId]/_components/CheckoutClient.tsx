"use client";
// src/app/(main)/checkout/[courseId]/_components/CheckoutClient.tsx

import { useState } from "react";
import { initiateStripeCheckout } from "@/lib/api/checkout";
import type { Cart, CartItem } from "@/types/checkout";
import CartSummary from "./CartSummary";
import OrderSummary, { type ButtonStep } from "./OrderSummary";

interface CheckoutClientProps {
  initialCart: Cart;
}

export default function CheckoutClient({ initialCart }: CheckoutClientProps) {
  const [items] = useState<CartItem[]>(initialCart.items);
  const [subtotal] = useState<number>(initialCart.subtotal);
  const [total] = useState<number>(initialCart.total);
  const [buttonStep, setButtonStep] = useState<ButtonStep>("idle");
  const [error, setError] = useState<string | null>(null);

  // ── checkout ─────────────────────────────────────────────────────────────────

  async function handleCheckout() {
    setError(null);
    setButtonStep("loading");

    // Stripe destination charges pay one full course into one instructor's
    // connected account. Use the full-course item in the cart.
    const course = items.find((i) => i.type === "full_course") ?? items[0];
    if (!course?.courseId) {
      setButtonStep("idle");
      setError("Your cart is empty.");
      return;
    }
    if (course.type !== "full_course") {
      setButtonStep("idle");
      setError("Card checkout currently supports full-course purchases only.");
      return;
    }

    try {
      const { url } = await initiateStripeCheckout(course.courseId);
      // Full-page redirect to Stripe's hosted checkout; it returns the browser
      // to /checkout/stripe-success (success_url set on the backend).
      setButtonStep("redirect");
      window.location.assign(url);
    } catch (e) {
      setButtonStep("idle");
      setError((e as Error).message || "Payment could not be initiated.");
    }
  }

  // ── render ───────────────────────────────────────────────────────────────────

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
      {/* Left column — cart items */}
      <div className="flex flex-col gap-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-3">
            <svg
              className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-red-600 text-sm font-medium">{error}</p>
          </div>
        )}

        <CartSummary items={items} />
      </div>

      {/* Right column — order summary */}
      <OrderSummary
        items={items}
        subtotal={subtotal}
        total={total}
        buttonStep={buttonStep}
        onConfirm={handleCheckout}
      />
    </div>
  );
}
