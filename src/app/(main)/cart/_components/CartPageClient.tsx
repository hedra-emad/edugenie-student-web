"use client";
// src/app/(main)/cart/_components/CartPageClient.tsx
// Central state machine for the cart page.
// Requirements: 1.2, 1.4, 1.6, 1.7, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7,
//               4.3, 4.4, 5.3, 5.4, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7,
//               7.5, 8.1, 8.2, 9.1, 9.2, 9.3

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { Cart, CartItem } from "@/types/checkout";
import { getCart, removeFromCart } from "@/lib/api/checkout";
import { validateCoupon } from "@/lib/api/coupon";
import { useCartContext } from "@/contexts/CartContext";

import CartSkeleton from "./CartSkeleton";
import CartEmptyState from "./CartEmptyState";
import CartItemList from "./CartItemList";
import CartOrderSummary, { type CouponState } from "./CartOrderSummary";

// ─── props ────────────────────────────────────────────────────────────────────

interface CartPageClientProps {
  initialCart: Cart | null;
  /**
   * Only used in unit tests to pre-seed fetchError state.
   * Allows testing the "auth" error path without a real HTTP 401 response.
   * @internal
   */
  __testFetchError?: "auth" | "network";
}

// ─── component ────────────────────────────────────────────────────────────────

export default function CartPageClient({ initialCart, __testFetchError }: CartPageClientProps) {
  const router = useRouter();
  const { setCartCount } = useCartContext();

  // ── state ──────────────────────────────────────────────────────────────────

  const [items, setItems] = useState<CartItem[]>(
    initialCart ? initialCart.items : [],
  );
  const [subtotal, setSubtotal] = useState<number>(
    initialCart ? initialCart.subtotal : 0,
  );
  const [total, setTotal] = useState<number>(
    initialCart ? initialCart.total : 0,
  );
  const [fetchError, setFetchError] = useState<"auth" | "network" | null>(
    __testFetchError ?? (initialCart === null ? "network" : null),
  );
  const [retryCount, setRetryCount] = useState<0 | 1>(0);
  const [couponState, setCouponState] = useState<CouponState>({
    status: "hidden",
  });
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [errorIds, setErrorIds] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // ── on mount: sync cart count badge ───────────────────────────────────────
  // Req 7.5: pass null when no cart was fetched, otherwise pass item count

  useEffect(() => {
    if (initialCart === null) {
      setCartCount(null);
    } else {
      setCartCount(initialCart.items.length);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── helpers ────────────────────────────────────────────────────────────────

  function addErrorId(id: string, message: string) {
    setErrorIds((prev) => {
      const next = new Map(prev);
      next.set(id, message);
      return next;
    });
  }

  function removeErrorId(id: string) {
    setErrorIds((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }

  function handleDismissError(id: string) {
    removeErrorId(id);
  }

  // ── optimistic item removal (Req 3.2–3.7) ─────────────────────────────────

  async function handleRequestRemove(id: string): Promise<void> {
    // 1. Optimistically hide the item
    const removedItem = items.find((item) => item._id === id);
    if (!removedItem) return;

    setItems((prev) => prev.filter((item) => item._id !== id));

    // 2. Add to removingIds
    setRemovingIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    // 3. Set up 30s AbortController timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000);

    try {
      let success: boolean;
      try {
        success = await removeFromCart(id);
      } catch (err) {
        if (controller.signal.aborted || (err instanceof Error && err.name === "AbortError")) {
          // timeout path — restore item + show timeout error
          setItems((prev) => {
            const alreadyRestored = prev.some((i) => i._id === id);
            if (alreadyRestored) return prev;
            return [...prev, removedItem];
          });
          setRemovingIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
          addErrorId(id, "Request timed out");
          return;
        }
        // Other exception — treat as failure
        success = false;
      }

      // 4. On success
      if (success) {
        setRemovingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        // items already filtered — count reflects removal
        setCartCount(items.filter((item) => item._id !== id).length);
      } else {
        // 5. On failure — restore item
        setItems((prev) => {
          const alreadyRestored = prev.some((i) => i._id === id);
          if (alreadyRestored) return prev;
          return [...prev, removedItem];
        });
        setRemovingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        addErrorId(id, "Failed to remove item. Please try again.");
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // ── re-fetch handler (Req 9.3) ─────────────────────────────────────────────

  async function handleTryAgain(): Promise<void> {
    if (retryCount >= 1) return;

    setIsLoading(true);

    const cart = await getCart(); // client-side: uses cookies via credentials: include

    if (cart) {
      setItems(cart.items);
      setSubtotal(cart.subtotal);
      setTotal(cart.total);
      setFetchError(null);
      setRetryCount(1);
      setCartCount(cart.items.length);
    } else {
      setFetchError("network");
      setRetryCount(1);
    }

    setIsLoading(false);
  }

  // ── coupon apply handler ───────────────────────────────────────────────────

  async function handleApplyCoupon(code: string): Promise<void> {
    setCouponState({ status: "open", code, validating: true });

    const result = await validateCoupon(code);

    if (result === null) {
      // Network / 5xx error
      setCouponState({
        status: "error",
        code,
        message:
          "Could not connect to validate the coupon. Please try again.",
        kind: "network",
      });
      return;
    }

    if (!result.valid) {
      setCouponState({
        status: "error",
        code,
        message: result.message ?? "Invalid or expired coupon code",
        kind: "invalid",
      });
      return;
    }

    // Valid coupon
    setCouponState({
      status: "applied",
      code,
      discountAmount: result.discountAmount,
    });
    setTotal(result.updatedTotal);
  }

  // ── coupon remove handler ──────────────────────────────────────────────────

  function handleRemoveCoupon(): void {
    setCouponState({ status: "hidden" });
    // Restore original total from initialCart, or fall back to subtotal
    setTotal(initialCart?.total ?? subtotal);
  }

  // ── checkout handler (Req 5.3, 5.4) ───────────────────────────────────────

  function handleCheckout(): void {
    if (items.length === 0 || !items[0].courseId) {
      setCheckoutError("Cannot proceed: no course selected");
      setErrorIds((prev) => {
        const next = new Map(prev);
        next.set("checkout", "Cannot proceed: no course selected");
        return next;
      });
      return;
    }
    router.push(`/checkout/${items[0].courseId}`);
  }

  // ── build item-only errorIds (exclude "checkout" key) ─────────────────────

  const itemErrorIds = new Map(
    Array.from(errorIds.entries()).filter(([key]) => key !== "checkout"),
  );

  // ── render ─────────────────────────────────────────────────────────────────

  // 1. Loading state (re-fetch in progress)
  if (isLoading) {
    return <CartSkeleton />;
  }

  // 2. Fetch error state
  if (fetchError) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 py-20 flex flex-col items-center text-center gap-6">
        <svg
          className="w-16 h-16 text-slate-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>

        {fetchError === "auth" ? (
          <>
            <p className="text-slate-700 text-base font-medium">
              Your session may have expired. Please{" "}
              <Link
                href="/login"
                className="text-[#3B1892] font-semibold underline hover:opacity-80 transition-opacity"
              >
                log in
              </Link>{" "}
              again.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-slate-900 text-base font-semibold">
              We couldn&apos;t load your cart
            </h2>
            <p className="text-slate-500 text-sm max-w-sm">
              This is usually a temporary issue. Your items are saved — try
              refreshing the page.
            </p>
            {retryCount < 1 && (
              <button
                onClick={handleTryAgain}
                className="px-6 py-3 rounded-xl text-sm font-bold text-white transition-colors duration-150 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#3B1892]"
                style={{ backgroundColor: "#3B1892" }}
              >
                Refresh page
              </button>
            )}
            {retryCount >= 1 && (
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 rounded-xl text-sm font-bold text-white transition-colors duration-150 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#3B1892]"
                style={{ backgroundColor: "#3B1892" }}
              >
                Refresh page
              </button>
            )}
            <Link
              href="/courses"
              className="text-[#3B1892] underline text-sm"
            >
              Browse courses
            </Link>
          </>
        )}
      </div>
    );
  }

  // 3. Empty cart state
  if (items.length === 0) {
    return <CartEmptyState />;
  }

  // 4. Two-column cart layout
  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Your Cart</h1>

      {/* Checkout inline error (shown above the grid) */}
      {checkoutError && (
        <p className="text-red-500 text-sm mb-4" role="alert">
          {checkoutError}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
        <CartItemList
          items={items}
          removingIds={removingIds}
          errorIds={itemErrorIds}
          onRequestRemove={handleRequestRemove}
          onDismissError={handleDismissError}
        />
        <CartOrderSummary
          items={items}
          subtotal={subtotal}
          total={total}
          couponState={couponState}
          onApplyCoupon={handleApplyCoupon}
          onRemoveCoupon={handleRemoveCoupon}
          onCheckout={handleCheckout}
        />
      </div>
    </div>
  );
}
