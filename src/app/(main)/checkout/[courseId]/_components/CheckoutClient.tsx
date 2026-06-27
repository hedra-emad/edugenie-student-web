"use client";
// src/app/(main)/checkout/[courseId]/_components/CheckoutClient.tsx

import { useState } from "react";
import { initiateCheckout } from "@/lib/api/checkout";
import type { Cart, CartItem } from "@/types/checkout";
import CartSummary from "./CartSummary";
import OrderSummary, { type ButtonStep } from "./OrderSummary";
import PaymobIframe from "./PaymobIframe";

interface CheckoutClientProps {
  initialCart: Cart;
}

export default function CheckoutClient({ initialCart }: CheckoutClientProps) {
  const [items] = useState<CartItem[]>(initialCart.items);
  const [subtotal] = useState<number>(initialCart.subtotal);
  const [total] = useState<number>(initialCart.total);
  const [buttonStep, setButtonStep] = useState<ButtonStep>("idle");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ── checkout

  async function handleCheckout() {
    setError(null);
    setButtonStep("loading");

    const result = await initiateCheckout();

    if (!result || !result.clientSecret) {
      setButtonStep("idle");
      setError(
        result === null
          ? "Unable to reach the payment service. Please check your connection and try again."
          : "Payment could not be initiated. Please try again.",
      );
      return;
    }

    // Step 3: show "Redirecting to Paymob..." briefly before swapping in the iframe
    setButtonStep("redirect");
    setTimeout(() => {
      setClientSecret(result.clientSecret);
    }, 800);
  }

  // ── iframe view ───────────────────────────────────────────────────────────────

  if (clientSecret) {
    return (
      <div className="max-w-2xl mx-auto">
        <PaymobIframe clientSecret={clientSecret} />
      </div>
    );
  }

  // ── checkout view ─────────────────────────────────────────────────────────────

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
      {/* Left column — cart items */}
      <div className="flex flex-col gap-4">
        {/* Error banner */}
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
