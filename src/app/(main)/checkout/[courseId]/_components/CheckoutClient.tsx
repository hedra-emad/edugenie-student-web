"use client";
// src/app/(main)/checkout/[courseId]/_components/CheckoutClient.tsx

import { useState } from "react";
import { initiateCheckout } from "@/lib/api/checkout";
import type { Cart, CartItem } from "@/types/checkout";
import CartSummary from "./CartSummary";
import OrderSummary, { type ButtonStep } from "./OrderSummary";

interface CheckoutClientProps {
  initialCart: Cart;
}

// Non-secret Paymob public key (egy_pk_...). Used to build the hosted
// Unified Checkout URL we redirect the customer to.
const PAYMOB_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYMOB_PUBLIC_KEY ?? "";

function buildPaymobCheckoutUrl(clientSecret: string): string {
  return (
    `https://accept.paymob.com/unifiedcheckout/` +
    `?publicKey=${encodeURIComponent(PAYMOB_PUBLIC_KEY)}` +
    `&clientSecret=${encodeURIComponent(clientSecret)}`
  );
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

    if (!PAYMOB_PUBLIC_KEY) {
      setButtonStep("idle");
      setError(
        "Payment is not configured. Please contact support (missing payment key).",
      );
      return;
    }

    // Full-page redirect to Paymob's hosted (dashboard-branded) checkout. This
    // avoids the nested-iframe scrollbar and the Chrome "public→localhost"
    // block, and Paymob returns the browser to /checkout/success afterwards
    // (via the intention's redirection_url set on the backend).
    setButtonStep("redirect");
    window.location.assign(buildPaymobCheckoutUrl(result.clientSecret));
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
