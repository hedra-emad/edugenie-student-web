"use client";
// src/app/(main)/cart/_components/CartPageClient.tsx
// Central state machine for the cart page.
// Requirements: 1.2, 1.4, 1.6, 1.7, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7,
//               4.3, 4.4, 5.3, 5.4, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7,
//               7.5, 8.1, 8.2, 9.1, 9.2, 9.3

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import type { Cart, CartItem } from "@/types/checkout";
import { getCart, removeFromCart } from "@/lib/api/checkout";
import { useCartContext } from "@/contexts/CartContext";

import CartSkeleton from "./CartSkeleton";
import CartEmptyState from "./CartEmptyState";
import CartItemList from "./CartItemList";
import CartOrderSummary from "./CartOrderSummary";
import Button from "@/components/ui/Button";
import {
  getCartItemRemoveId,
  groupCartItemsByCourse,
  getOrderedCourseIds,
} from "./cartItemUtils";

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
  const queryClient = useQueryClient();

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

  async function handleRequestRemove(removeId: string): Promise<void> {
    const removedItem = items.find(
      (item) => getCartItemRemoveId(item) === removeId,
    );
    if (!removedItem) return;

    setItems((prev) =>
      prev.filter((item) => getCartItemRemoveId(item) !== removeId),
    );

    setRemovingIds((prev) => {
      const next = new Set(prev);
      next.add(removeId);
      return next;
    });

    // 3. Set up 30s AbortController timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000);

    try {
      let success: boolean;
      try {
        success = await removeFromCart(removeId);
      } catch (err) {
        if (controller.signal.aborted || (err instanceof Error && err.name === "AbortError")) {
          // timeout path — restore item + show timeout error
          setItems((prev) => {
            const alreadyRestored = prev.some(
              (i) => getCartItemRemoveId(i) === removeId,
            );
            if (alreadyRestored) return prev;
            return [...prev, removedItem];
          });
          setRemovingIds((prev) => {
            const next = new Set(prev);
            next.delete(removeId);
            return next;
          });
          addErrorId(removeId, "Request timed out");
          return;
        }
        // Other exception — treat as failure
        success = false;
      }

      // 4. On success
      if (success) {
        setRemovingIds((prev) => {
          const next = new Set(prev);
          next.delete(removeId);
          return next;
        });
        const remaining = items.filter(
          (item) => getCartItemRemoveId(item) !== removeId,
        );
        setCartCount(remaining.length);
        // Invalidate React Query cache so the header badge syncs immediately
        await queryClient.invalidateQueries({ queryKey: ["cart"] });
      } else {
        // 5. On failure — restore item
        setItems((prev) => {
          const alreadyRestored = prev.some(
            (i) => getCartItemRemoveId(i) === removeId,
          );
          if (alreadyRestored) return prev;
          return [...prev, removedItem];
        });
        setRemovingIds((prev) => {
          const next = new Set(prev);
          next.delete(removeId);
          return next;
        });
        addErrorId(removeId, "Failed to remove item. Please try again.");
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
              <Button onClick={handleTryAgain}>Refresh page</Button>
            )}
            {retryCount >= 1 && (
              <Button onClick={() => window.location.reload()}>
                Refresh page
              </Button>
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

  const groupedItems = groupCartItemsByCourse(items);
  const orderedCourseIds = getOrderedCourseIds(items);

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
          groupedItems={groupedItems}
          orderedCourseIds={orderedCourseIds}
          removingIds={removingIds}
          errorIds={itemErrorIds}
          onRequestRemove={handleRequestRemove}
          onDismissError={handleDismissError}
          getRemoveId={getCartItemRemoveId}
        />
        <CartOrderSummary
          items={items}
          subtotal={subtotal}
          total={total}
          onCheckout={handleCheckout}
        />
      </div>
    </div>
  );
}
